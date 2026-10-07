-- Shop phase 3: per-seller shop settings, orders, order items, order timeline.
-- Apply once per database, after 1_shop_catalog.

-- AlterTable
ALTER TABLE `site_settings` ADD COLUMN `shopFees` JSON NULL;

-- CreateTable
CREATE TABLE `shop_settings` (
    `companyId` VARCHAR(128) NOT NULL,
    `pickupEnabled` BOOLEAN NOT NULL DEFAULT true,
    `pickupAddress` VARCHAR(512) NULL,
    `deliveryEnabled` BOOLEAN NOT NULL DEFAULT false,
    `deliveryFee` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `deliveryFeeByCity` JSON NOT NULL,
    `deliveryCities` JSON NOT NULL,
    `freeDeliveryOver` DECIMAL(12, 2) NULL,
    `minOrderAmount` DECIMAL(12, 2) NULL,
    `acceptsCash` BOOLEAN NOT NULL DEFAULT true,
    `acceptsMuniDinero` BOOLEAN NOT NULL DEFAULT false,
    `orderNotes` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`companyId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shop_orders` (
    `id` VARCHAR(128) NOT NULL,
    `orderNumber` VARCHAR(32) NOT NULL,
    `checkoutId` VARCHAR(128) NOT NULL,
    `companyId` VARCHAR(128) NOT NULL,
    `companyName` VARCHAR(255) NOT NULL,
    `customerId` VARCHAR(128) NULL,
    `customerName` VARCHAR(255) NOT NULL,
    `customerPhone` VARCHAR(64) NOT NULL,
    `customerEmail` VARCHAR(255) NULL,
    `deliveryMethod` ENUM('pickup', 'delivery') NOT NULL,
    `deliveryCity` VARCHAR(128) NULL,
    `deliveryAddress` VARCHAR(512) NULL,
    `paymentMethod` ENUM('cash', 'muni_dinero') NOT NULL,
    `paymentStatus` ENUM('pending', 'paid', 'refunded') NOT NULL DEFAULT 'pending',
    `status` ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `deliveryFee` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(12, 2) NOT NULL,
    `commissionPercent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `commissionAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `cancelReason` VARCHAR(512) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `shop_orders_orderNumber_key`(`orderNumber`),
    INDEX `shop_orders_companyId_status_createdAt_idx`(`companyId`, `status`, `createdAt`),
    INDEX `shop_orders_customerId_createdAt_idx`(`customerId`, `createdAt`),
    INDEX `shop_orders_checkoutId_idx`(`checkoutId`),
    INDEX `shop_orders_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shop_order_items` (
    `id` VARCHAR(128) NOT NULL,
    `orderId` VARCHAR(128) NOT NULL,
    `productId` VARCHAR(128) NULL,
    `variantId` VARCHAR(128) NULL,
    `productTitle` VARCHAR(255) NOT NULL,
    `productSlug` VARCHAR(255) NULL,
    `variantTitle` VARCHAR(255) NOT NULL,
    `sku` VARCHAR(64) NULL,
    `image` TEXT NULL,
    `unitPrice` DECIMAL(12, 2) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `lineTotal` DECIMAL(12, 2) NOT NULL,
    `stockReserved` BOOLEAN NOT NULL DEFAULT false,

    INDEX `shop_order_items_orderId_idx`(`orderId`),
    INDEX `shop_order_items_productId_idx`(`productId`),
    INDEX `shop_order_items_variantId_idx`(`variantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shop_order_events` (
    `id` VARCHAR(128) NOT NULL,
    `orderId` VARCHAR(128) NOT NULL,
    `status` ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL,
    `note` VARCHAR(512) NULL,
    `actorId` VARCHAR(128) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `shop_order_events_orderId_createdAt_idx`(`orderId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `shop_settings` ADD CONSTRAINT `shop_settings_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_orders` ADD CONSTRAINT `shop_orders_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_orders` ADD CONSTRAINT `shop_orders_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_order_items` ADD CONSTRAINT `shop_order_items_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `shop_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_order_items` ADD CONSTRAINT `shop_order_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_order_items` ADD CONSTRAINT `shop_order_items_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_order_events` ADD CONSTRAINT `shop_order_events_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `shop_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

