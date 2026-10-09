-- AlterTable
ALTER TABLE `companies` ADD COLUMN `verifiedUntil` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `company_verifications` (
    `id` VARCHAR(128) NOT NULL,
    `companyId` VARCHAR(128) NOT NULL,
    `userId` VARCHAR(128) NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `documents` JSON NOT NULL,
    `note` TEXT NULL,
    `reviewNote` TEXT NULL,
    `reviewedBy` VARCHAR(128) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `company_verifications_status_idx`(`status`),
    INDEX `company_verifications_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `claim_codes` (
    `id` VARCHAR(128) NOT NULL,
    `companyId` VARCHAR(128) NOT NULL,
    `userId` VARCHAR(128) NOT NULL,
    `codeHash` VARCHAR(128) NOT NULL,
    `sentTo` VARCHAR(255) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `claim_codes_companyId_userId_idx`(`companyId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `company_verifications` ADD CONSTRAINT `company_verifications_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_verifications` ADD CONSTRAINT `company_verifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claim_codes` ADD CONSTRAINT `claim_codes_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claim_codes` ADD CONSTRAINT `claim_codes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

