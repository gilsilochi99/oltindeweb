-- Shop phase 1: product catalog (categories, products, images, variants, stock log).
-- Apply once per database: mysql ... oltinde < migration.sql (or phpMyAdmin Import).

-- CreateTable
CREATE TABLE `product_categories` (
    `id` VARCHAR(128) NOT NULL,
    `parentId` VARCHAR(128) NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `image` TEXT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `product_categories_slug_key`(`slug`),
    INDEX `product_categories_parentId_position_idx`(`parentId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(128) NOT NULL,
    `companyId` VARCHAR(128) NOT NULL,
    `categoryId` VARCHAR(128) NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `shortDescription` VARCHAR(512) NULL,
    `description` TEXT NOT NULL,
    `brand` VARCHAR(128) NULL,
    `condition` ENUM('new', 'used', 'refurbished') NOT NULL DEFAULT 'new',
    `status` ENUM('draft', 'active', 'archived') NOT NULL DEFAULT 'draft',
    `options` JSON NOT NULL,
    `specs` JSON NOT NULL,
    `tags` JSON NOT NULL,
    `minPrice` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `maxPrice` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `totalStock` INTEGER NOT NULL DEFAULT 0,
    `inStock` BOOLEAN NOT NULL DEFAULT false,
    `isOnSale` BOOLEAN NOT NULL DEFAULT false,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `ratingAvg` DECIMAL(3, 2) NOT NULL DEFAULT 0,
    `ratingCount` INTEGER NOT NULL DEFAULT 0,
    `salesCount` INTEGER NOT NULL DEFAULT 0,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_slug_key`(`slug`),
    INDEX `products_companyId_status_idx`(`companyId`, `status`),
    INDEX `products_categoryId_status_idx`(`categoryId`, `status`),
    INDEX `products_status_publishedAt_idx`(`status`, `publishedAt`),
    INDEX `products_status_minPrice_idx`(`status`, `minPrice`),
    INDEX `products_status_isFeatured_idx`(`status`, `isFeatured`),
    INDEX `products_status_inStock_idx`(`status`, `inStock`),
    INDEX `products_brand_idx`(`brand`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_images` (
    `id` VARCHAR(128) NOT NULL,
    `productId` VARCHAR(128) NOT NULL,
    `url` TEXT NOT NULL,
    `alt` VARCHAR(255) NULL,
    `position` INTEGER NOT NULL DEFAULT 0,

    INDEX `product_images_productId_position_idx`(`productId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_variants` (
    `id` VARCHAR(128) NOT NULL,
    `productId` VARCHAR(128) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `optionValues` JSON NOT NULL,
    `sku` VARCHAR(64) NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `compareAtPrice` DECIMAL(12, 2) NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `trackInventory` BOOLEAN NOT NULL DEFAULT true,
    `allowBackorder` BOOLEAN NOT NULL DEFAULT false,
    `image` TEXT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `product_variants_productId_position_idx`(`productId`, `position`),
    INDEX `product_variants_sku_idx`(`sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_movements` (
    `id` VARCHAR(128) NOT NULL,
    `productId` VARCHAR(128) NOT NULL,
    `variantId` VARCHAR(128) NULL,
    `delta` INTEGER NOT NULL,
    `stockAfter` INTEGER NOT NULL,
    `reason` ENUM('initial', 'adjustment', 'sale', 'cancellation', 'return') NOT NULL,
    `orderId` VARCHAR(128) NULL,
    `note` VARCHAR(512) NULL,
    `userId` VARCHAR(128) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `inventory_movements_productId_createdAt_idx`(`productId`, `createdAt`),
    INDEX `inventory_movements_variantId_idx`(`variantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product_categories` ADD CONSTRAINT `product_categories_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `product_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `product_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


-- Seed: starter top-level categories (admins can edit/extend in /admin/shop/categories).
INSERT INTO `product_categories` (`id`, `name`, `slug`, `position`) VALUES
  ('cat-electronica', 'Electrónica', 'electronica', 1),
  ('cat-moviles', 'Móviles y Accesorios', 'moviles-y-accesorios', 2),
  ('cat-informatica', 'Informática', 'informatica', 3),
  ('cat-moda', 'Moda y Complementos', 'moda-y-complementos', 4),
  ('cat-belleza', 'Belleza y Cuidado Personal', 'belleza-y-cuidado-personal', 5),
  ('cat-hogar', 'Hogar y Cocina', 'hogar-y-cocina', 6),
  ('cat-electrodomesticos', 'Electrodomésticos', 'electrodomesticos', 7),
  ('cat-alimentacion', 'Alimentación y Bebidas', 'alimentacion-y-bebidas', 8),
  ('cat-salud', 'Salud', 'salud', 9),
  ('cat-bebes', 'Bebés y Niños', 'bebes-y-ninos', 10),
  ('cat-deportes', 'Deportes y Aire Libre', 'deportes-y-aire-libre', 11),
  ('cat-motor', 'Motor', 'motor', 12),
  ('cat-construccion', 'Construcción y Ferretería', 'construccion-y-ferreteria', 13),
  ('cat-oficina', 'Oficina y Papelería', 'oficina-y-papeleria', 14),
  ('cat-libros', 'Libros y Música', 'libros-y-musica', 15),
  ('cat-otros', 'Otros', 'otros', 99);
