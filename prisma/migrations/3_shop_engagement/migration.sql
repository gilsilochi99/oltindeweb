-- Shop phase 4: product reviews/wishlist (enum values), Q&A, seller coupons.
-- Apply once per database, after 2_shop_orders.

-- AlterTable
ALTER TABLE `reviews` ADD COLUMN `isVerifiedPurchase` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `targetType` ENUM('company', 'institution', 'procedure', 'professional', 'touristLocation', 'itinerary', 'product') NOT NULL;

-- AlterTable
ALTER TABLE `shop_orders` ADD COLUMN `couponCode` VARCHAR(64) NULL,
    ADD COLUMN `couponId` VARCHAR(128) NULL;

-- AlterTable
ALTER TABLE `user_favorites` DROP PRIMARY KEY,
    MODIFY `type` ENUM('companies', 'procedures', 'institutions', 'jobs', 'events', 'places', 'itineraries', 'professionals', 'products') NOT NULL,
    ADD PRIMARY KEY (`userId`, `type`, `entityId`);

-- CreateTable
CREATE TABLE `product_questions` (
    `id` VARCHAR(128) NOT NULL,
    `productId` VARCHAR(128) NOT NULL,
    `authorId` VARCHAR(128) NULL,
    `authorName` VARCHAR(255) NOT NULL,
    `question` TEXT NOT NULL,
    `answer` TEXT NULL,
    `answeredAt` DATETIME(3) NULL,
    `answeredBy` VARCHAR(128) NULL,
    `isHidden` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `product_questions_productId_isHidden_createdAt_idx`(`productId`, `isHidden`, `createdAt`),
    INDEX `product_questions_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupons` (
    `id` VARCHAR(128) NOT NULL,
    `companyId` VARCHAR(128) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `description` VARCHAR(255) NULL,
    `type` ENUM('percent', 'fixed') NOT NULL,
    `value` DECIMAL(12, 2) NOT NULL,
    `minSubtotal` DECIMAL(12, 2) NULL,
    `maxUses` INTEGER NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `coupons_companyId_code_key`(`companyId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `shop_orders` ADD CONSTRAINT `shop_orders_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_questions` ADD CONSTRAINT `product_questions_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coupons` ADD CONSTRAINT `coupons_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

