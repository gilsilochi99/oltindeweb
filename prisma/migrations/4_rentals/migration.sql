-- Rentals module: listings (properties + vehicles), images, blocked dates,
-- booking requests and their timeline; enum values for rental reviews and
-- favorites; rentals commission setting. Apply once, after 3_shop_engagement.

-- AlterTable
ALTER TABLE `reviews` MODIFY `targetType` ENUM('company', 'institution', 'procedure', 'professional', 'touristLocation', 'itinerary', 'product', 'rental') NOT NULL;

-- AlterTable
ALTER TABLE `site_settings` ADD COLUMN `rentalFees` JSON NULL;

-- AlterTable
ALTER TABLE `user_favorites` DROP PRIMARY KEY,
    MODIFY `type` ENUM('companies', 'procedures', 'institutions', 'jobs', 'events', 'places', 'itineraries', 'professionals', 'products', 'rentals') NOT NULL,
    ADD PRIMARY KEY (`userId`, `type`, `entityId`);

-- CreateTable
CREATE TABLE `rental_listings` (
    `id` VARCHAR(128) NOT NULL,
    `companyId` VARCHAR(128) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `category` ENUM('property', 'vehicle') NOT NULL,
    `kind` VARCHAR(64) NOT NULL,
    `status` ENUM('draft', 'active', 'archived') NOT NULL DEFAULT 'draft',
    `city` VARCHAR(128) NOT NULL,
    `neighborhood` VARCHAR(255) NULL,
    `address` VARCHAR(512) NULL,
    `lat` DOUBLE NULL,
    `lng` DOUBLE NULL,
    `shortTermEnabled` BOOLEAN NOT NULL DEFAULT false,
    `dailyPrice` DECIMAL(12, 2) NULL,
    `minUnits` INTEGER NOT NULL DEFAULT 1,
    `maxUnits` INTEGER NULL,
    `longTermEnabled` BOOLEAN NOT NULL DEFAULT false,
    `monthlyPrice` DECIMAL(12, 2) NULL,
    `minMonths` INTEGER NOT NULL DEFAULT 1,
    `deposit` DECIMAL(12, 2) NULL,
    `priceNotes` VARCHAR(512) NULL,
    `bedrooms` INTEGER NULL,
    `bathrooms` INTEGER NULL,
    `areaM2` INTEGER NULL,
    `maxGuests` INTEGER NULL,
    `furnished` BOOLEAN NULL,
    `brand` VARCHAR(128) NULL,
    `model` VARCHAR(128) NULL,
    `year` INTEGER NULL,
    `transmission` VARCHAR(32) NULL,
    `fuel` VARCHAR(32) NULL,
    `seats` INTEGER NULL,
    `driverOption` ENUM('none', 'optional', 'required') NULL,
    `driverDailyFee` DECIMAL(12, 2) NULL,
    `amenities` JSON NOT NULL,
    `rules` TEXT NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `ratingAvg` DECIMAL(3, 2) NOT NULL DEFAULT 0,
    `ratingCount` INTEGER NOT NULL DEFAULT 0,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `bookingCount` INTEGER NOT NULL DEFAULT 0,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rental_listings_slug_key`(`slug`),
    INDEX `rental_listings_status_category_city_idx`(`status`, `category`, `city`),
    INDEX `rental_listings_companyId_status_idx`(`companyId`, `status`),
    INDEX `rental_listings_status_dailyPrice_idx`(`status`, `dailyPrice`),
    INDEX `rental_listings_status_monthlyPrice_idx`(`status`, `monthlyPrice`),
    INDEX `rental_listings_status_isFeatured_idx`(`status`, `isFeatured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rental_images` (
    `id` VARCHAR(128) NOT NULL,
    `listingId` VARCHAR(128) NOT NULL,
    `url` TEXT NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,

    INDEX `rental_images_listingId_position_idx`(`listingId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rental_blocks` (
    `id` VARCHAR(128) NOT NULL,
    `listingId` VARCHAR(128) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `note` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `rental_blocks_listingId_startDate_idx`(`listingId`, `startDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rental_bookings` (
    `id` VARCHAR(128) NOT NULL,
    `bookingNumber` VARCHAR(32) NOT NULL,
    `accessToken` VARCHAR(64) NOT NULL,
    `listingId` VARCHAR(128) NULL,
    `companyId` VARCHAR(128) NOT NULL,
    `customerId` VARCHAR(128) NULL,
    `customerName` VARCHAR(255) NOT NULL,
    `customerPhone` VARCHAR(64) NOT NULL,
    `customerEmail` VARCHAR(255) NULL,
    `listingTitle` VARCHAR(255) NOT NULL,
    `listingSlug` VARCHAR(255) NULL,
    `listingImage` TEXT NULL,
    `category` ENUM('property', 'vehicle') NOT NULL,
    `term` ENUM('short', 'long') NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `units` INTEGER NOT NULL,
    `guests` INTEGER NULL,
    `withDriver` BOOLEAN NOT NULL DEFAULT false,
    `unitPrice` DECIMAL(12, 2) NOT NULL,
    `driverFee` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `deposit` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(12, 2) NOT NULL,
    `commissionPercent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `commissionAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `message` TEXT NULL,
    `status` ENUM('pending', 'accepted', 'rejected', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
    `ownerNote` VARCHAR(512) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rental_bookings_bookingNumber_key`(`bookingNumber`),
    UNIQUE INDEX `rental_bookings_accessToken_key`(`accessToken`),
    INDEX `rental_bookings_listingId_status_startDate_idx`(`listingId`, `status`, `startDate`),
    INDEX `rental_bookings_companyId_status_createdAt_idx`(`companyId`, `status`, `createdAt`),
    INDEX `rental_bookings_customerId_createdAt_idx`(`customerId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rental_booking_events` (
    `id` VARCHAR(128) NOT NULL,
    `bookingId` VARCHAR(128) NOT NULL,
    `status` ENUM('pending', 'accepted', 'rejected', 'cancelled', 'completed') NOT NULL,
    `note` VARCHAR(512) NULL,
    `actorId` VARCHAR(128) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `rental_booking_events_bookingId_createdAt_idx`(`bookingId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rental_listings` ADD CONSTRAINT `rental_listings_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_images` ADD CONSTRAINT `rental_images_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `rental_listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_blocks` ADD CONSTRAINT `rental_blocks_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `rental_listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_bookings` ADD CONSTRAINT `rental_bookings_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `rental_listings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_bookings` ADD CONSTRAINT `rental_bookings_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_bookings` ADD CONSTRAINT `rental_bookings_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_booking_events` ADD CONSTRAINT `rental_booking_events_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `rental_bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

