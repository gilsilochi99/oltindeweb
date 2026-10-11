-- AlterTable
ALTER TABLE `rental_bookings` ADD COLUMN `deliveryAddress` VARCHAR(512) NULL,
    ADD COLUMN `deliveryFee` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `endHour` INTEGER NULL,
    ADD COLUMN `ownerId` VARCHAR(128) NULL,
    ADD COLUMN `quantity` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `startHour` INTEGER NULL,
    ADD COLUMN `withDelivery` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `companyId` VARCHAR(128) NULL,
    MODIFY `category` ENUM('property', 'vehicle', 'item', 'space') NOT NULL,
    MODIFY `term` ENUM('short', 'long', 'hourly') NOT NULL;

-- AlterTable
ALTER TABLE `rental_listings` ADD COLUMN `deliveryFee` DECIMAL(12, 2) NULL,
    ADD COLUMN `deliveryOption` ENUM('none', 'optional', 'required') NULL,
    ADD COLUMN `hourlyEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `hourlyPrice` DECIMAL(12, 2) NULL,
    ADD COLUMN `minHours` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `ownerId` VARCHAR(128) NULL,
    ADD COLUMN `quantity` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `specs` JSON NULL,
    MODIFY `companyId` VARCHAR(128) NULL,
    MODIFY `category` ENUM('property', 'vehicle', 'item', 'space') NOT NULL;

-- CreateIndex
CREATE INDEX `rental_bookings_ownerId_status_createdAt_idx` ON `rental_bookings`(`ownerId`, `status`, `createdAt`);

-- CreateIndex
CREATE INDEX `rental_listings_ownerId_status_idx` ON `rental_listings`(`ownerId`, `status`);

-- AddForeignKey
ALTER TABLE `rental_listings` ADD CONSTRAINT `rental_listings_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_bookings` ADD CONSTRAINT `rental_bookings_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


-- AlterTable
ALTER TABLE `rental_listings` ADD COLUMN `contactPhone` VARCHAR(64) NULL;

