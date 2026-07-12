'use server';

import * as admin from 'firebase-admin';
import { getFirestore, Firestore, Timestamp } from 'firebase-admin/firestore';
import { promises as fs } from 'fs';
import path from 'path';

// --- CONFIGURACIÓN ---
// RELLENE ESTOS VALORES ANTES DE EJECUTAR
const SOURCE_PROJECT_ID = 'guineabiz';
const DESTINATION_PROJECT_ID = 'oltindeapp';

// Nombres de los archivos de credenciales que debe colocar en la raíz de su proyecto
const SOURCE_CREDS_FILE = 'firebase-source-credentials.json';
const DESTINATION_CREDS_FILE = 'firebase-destination-credentials.json';
// --- FIN DE LA CONFIGURACIÓN ---


let sourceDb: Firestore;
let destinationDb: Firestore;
let areAppsInitialized = false;

// Función para inicializar las apps de Firebase Admin de forma segura
async function initializeMigrationApps() {
    if (areAppsInitialized) return;

    try {
        // Inicializar App de Origen
        if (!admin.apps.some(app => app?.name === 'sourceApp')) {
            const sourceCreds = JSON.parse(await fs.readFile(path.resolve(process.cwd(), SOURCE_CREDS_FILE), 'utf8'));
            const sourceApp = admin.initializeApp({
                credential: admin.credential.cert(sourceCreds),
                projectId: SOURCE_PROJECT_ID,
            }, 'sourceApp');
             sourceDb = getFirestore(sourceApp);
        } else {
             sourceDb = getFirestore(admin.app('sourceApp'));
        }

        // Inicializar App de Destino
        if (!admin.apps.some(app => app?.name === 'destinationApp')) {
            const destCreds = JSON.parse(await fs.readFile(path.resolve(process.cwd(), DESTINATION_CREDS_FILE), 'utf8'));
            const destApp = admin.initializeApp({
                credential: admin.credential.cert(destCreds),
                projectId: DESTINATION_PROJECT_ID,
            }, 'destinationApp');
            destinationDb = getFirestore(destApp);
        } else {
             destinationDb = getFirestore(admin.app('destinationApp'));
        }
        
        areAppsInitialized = true;

    } catch (error: any) {
        console.error("Error al inicializar las apps de Firebase para la migración:", error);
        if (error.code === 'ENOENT') {
            throw new Error(`No se pudo encontrar un archivo de credenciales. Asegúrese de que '${SOURCE_CREDS_FILE}' y '${DESTINATION_CREDS_FILE}' existan en la raíz del proyecto.`);
        }
        throw new Error("No se pudo inicializar uno o ambos proyectos de Firebase. Revise las credenciales y los IDs de proyecto.");
    }
}


export async function migrateData() {
    const logs: string[] = [];
    const log = (message: string) => {
        console.log(message);
        logs.push(message);
    };

    try {
        log('Initializing Firebase applications...');
        await initializeMigrationApps();
        log('Firebase applications initialized successfully.');

        const collectionsToMigrate = ['companies', 'institutions', 'procedures', 'services', 'posts', 'users', 'claims', 'settings'];

        for (const collectionName of collectionsToMigrate) {
            log(`\nStarting migration for collection: ${collectionName}`);
            const sourceCollection = sourceDb.collection(collectionName);
            const destinationCollection = destinationDb.collection(collectionName);
            
            const sourceSnapshot = await sourceCollection.get();

            if (sourceSnapshot.empty) {
                log(`Collection '${collectionName}' is empty, skipping.`);
                continue;
            }

            log(`Found ${sourceSnapshot.size} documents in '${collectionName}'.`);

            const batchSize = 400; // Firestore batch limit is 500 writes
            let batch = destinationDb.batch();
            let countInBatch = 0;
            let totalCommitted = 0;

            for (const doc of sourceSnapshot.docs) {
                const docRef = destinationCollection.doc(doc.id);
                batch.set(docRef, doc.data());
                countInBatch++;

                if (countInBatch === batchSize) {
                    await batch.commit();
                    totalCommitted += countInBatch;
                    log(`  ...committed ${totalCommitted} documents.`);
                    batch = destinationDb.batch();
                    countInBatch = 0;
                }
            }

            if (countInBatch > 0) {
                await batch.commit();
                totalCommitted += countInBatch;
                log(`  ...committed final ${totalCommitted} documents.`);
            }

            log(`Finished migration for collection: ${collectionName}`);
        }

        log('\n--- MIGRATION COMPLETE ---');
        return { success: true, logs };

    } catch (error: any) {
        log(`\n--- MIGRATION FAILED ---`);
        log(`Error: ${error.message}`);
        console.error(error);
        return { success: false, logs, error: error.message };
    }
}

export async function fixTimestamps() {
    const logs: string[] = [];
    const log = (message: string) => {
        console.log(message);
        logs.push(message);
    };

    let db: Firestore;

    try {
        log('Initializing Firebase for timestamp fix...');
        if (!admin.apps.some(app => app?.name === 'destinationApp')) {
            const destCreds = JSON.parse(await fs.readFile(path.resolve(process.cwd(), DESTINATION_CREDS_FILE), 'utf8'));
            const destApp = admin.initializeApp({
                credential: admin.credential.cert(destCreds),
                projectId: DESTINATION_PROJECT_ID,
            }, 'destinationApp');
            db = getFirestore(destApp);
        } else {
            db = getFirestore(admin.app('destinationApp'));
        }
        log('Firebase initialized successfully.');

        const collectionsToFix = ['companies', 'posts'];
        for (const collectionName of collectionsToFix) {
            log(`\nProcessing collection: ${collectionName}`);
            const collectionRef = db.collection(collectionName);
            const snapshot = await collectionRef.get();
            let batch = db.batch();
            let writeCount = 0;

            for (const doc of snapshot.docs) {
                const data = doc.data();
                let needsUpdate = false;

                // Fix createdAt on the document itself
                if (data.createdAt && typeof data.createdAt === 'string') {
                    data.createdAt = Timestamp.fromDate(new Date(data.createdAt));
                    needsUpdate = true;
                }

                // Fix createdAt in announcements array
                if (data.announcements && Array.isArray(data.announcements)) {
                    data.announcements.forEach((ann: any) => {
                        if (ann.createdAt && typeof ann.createdAt === 'string') {
                            ann.createdAt = Timestamp.fromDate(new Date(ann.createdAt));
                            needsUpdate = true;
                        }
                    });
                }

                // Fix createdAt in offers array
                if (data.offers && Array.isArray(data.offers)) {
                    data.offers.forEach((offer: any) => {
                        if (offer.createdAt && typeof offer.createdAt === 'string') {
                            offer.createdAt = Timestamp.fromDate(new Date(offer.createdAt));
                            needsUpdate = true;
                        }
                    });
                }
                
                if (needsUpdate) {
                    batch.update(doc.ref, data);
                    writeCount++;
                    if (writeCount >= 400) {
                        await batch.commit();
                        log(`  ...committed ${writeCount} updates.`);
                        batch = db.batch();
                        writeCount = 0;
                    }
                }
            }

            if (writeCount > 0) {
                await batch.commit();
                log(`  ...committed final ${writeCount} updates.`);
            }
            log(`Finished processing for collection: ${collectionName}`);
        }

        log('\n--- TIMESTAMP FIX COMPLETE ---');
        return { success: true, logs };

    } catch (error: any) {
        log(`\n--- TIMESTAMP FIX FAILED ---`);
        log(`Error: ${error.message}`);
        console.error(error);
        return { success: false, logs, error: error.message };
    }
}
