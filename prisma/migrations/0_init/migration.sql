-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(128) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `displayName` VARCHAR(255) NOT NULL,
    `photoURL` TEXT NULL,
    `title` VARCHAR(255) NULL,
    `twitter` VARCHAR(255) NULL,
    `linkedin` VARCHAR(255) NULL,
    `role` ENUM('admin', 'manager', 'editor', 'pharmacist', 'user') NOT NULL DEFAULT 'user',
    `isPremium` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `notificationSettings` JSON NULL,
    `createdAt` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_favorites` (
    `userId` VARCHAR(128) NOT NULL,
    `type` ENUM('companies', 'procedures', 'institutions', 'jobs', 'events', 'places', 'itineraries', 'professionals') NOT NULL,
    `entityId` VARCHAR(128) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_favorites_type_entityId_idx`(`type`, `entityId`),
    PRIMARY KEY (`userId`, `type`, `entityId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_subscriptions` (
    `userId` VARCHAR(128) NOT NULL,
    `kind` ENUM('company', 'category') NOT NULL,
    `value` VARCHAR(255) NOT NULL,

    INDEX `user_subscriptions_kind_value_idx`(`kind`, `value`),
    PRIMARY KEY (`userId`, `kind`, `value`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fcm_tokens` (
    `token` VARCHAR(512) NOT NULL,
    `userId` VARCHAR(128) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fcm_tokens_userId_idx`(`userId`),
    PRIMARY KEY (`token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(128) NOT NULL,
    `userId` VARCHAR(128) NOT NULL,
    `message` TEXT NOT NULL,
    `link` VARCHAR(1024) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_isRead_idx`(`userId`, `isRead`),
    INDEX `notifications_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `branches` (
    `id` VARCHAR(128) NOT NULL,
    `companyId` VARCHAR(128) NULL,
    `institutionId` VARCHAR(128) NULL,
    `healthFacilityId` VARCHAR(128) NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `name` VARCHAR(255) NOT NULL,
    `address` VARCHAR(512) NOT NULL,
    `city` VARCHAR(128) NOT NULL,
    `lat` DOUBLE NULL,
    `lng` DOUBLE NULL,
    `phone` VARCHAR(64) NULL,
    `email` VARCHAR(255) NULL,
    `workingHours` JSON NOT NULL,
    `servicesOffered` JSON NOT NULL,

    INDEX `branches_companyId_idx`(`companyId`),
    INDEX `branches_institutionId_idx`(`institutionId`),
    INDEX `branches_healthFacilityId_idx`(`healthFacilityId`),
    INDEX `branches_city_idx`(`city`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` VARCHAR(128) NOT NULL,
    `targetType` ENUM('company', 'institution', 'procedure', 'professional', 'touristLocation', 'itinerary') NOT NULL,
    `targetId` VARCHAR(128) NOT NULL,
    `author` VARCHAR(255) NOT NULL,
    `authorId` VARCHAR(128) NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `source` VARCHAR(32) NULL,
    `replyText` TEXT NULL,
    `replyDate` DATETIME(3) NULL,

    INDEX `reviews_targetType_targetId_idx`(`targetType`, `targetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `companies` (
    `id` VARCHAR(128) NOT NULL,
    `ownerId` VARCHAR(128) NULL,
    `name` VARCHAR(255) NOT NULL,
    `legalForm` VARCHAR(128) NULL,
    `cif` VARCHAR(64) NULL,
    `logo` TEXT NULL,
    `image` TEXT NULL,
    `category` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `email` VARCHAR(255) NULL,
    `website` VARCHAR(512) NULL,
    `socialMedia` JSON NULL,
    `products` JSON NOT NULL,
    `highlights` JSON NOT NULL,
    `documents` JSON NOT NULL,
    `gallery` JSON NOT NULL,
    `yearEstablished` INTEGER NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isPremium` BOOLEAN NOT NULL DEFAULT false,
    `companySize` VARCHAR(64) NULL,
    `capitalOwnership` VARCHAR(64) NULL,
    `geographicScope` VARCHAR(64) NULL,
    `purpose` VARCHAR(64) NULL,
    `fiscalRegime` VARCHAR(64) NULL,
    `googlePlaceId` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `companies_googlePlaceId_key`(`googlePlaceId`),
    INDEX `companies_ownerId_idx`(`ownerId`),
    INDEX `companies_category_idx`(`category`),
    INDEX `companies_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_announcements` (
    `id` VARCHAR(128) NOT NULL,
    `companyId` VARCHAR(128) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `image` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `company_announcements_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_offers` (
    `id` VARCHAR(128) NOT NULL,
    `companyId` VARCHAR(128) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `discount` VARCHAR(128) NOT NULL,
    `validUntil` DATETIME(3) NULL,
    `image` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `company_offers_companyId_idx`(`companyId`),
    INDEX `company_offers_validUntil_idx`(`validUntil`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `claims` (
    `id` VARCHAR(128) NOT NULL,
    `companyId` VARCHAR(128) NOT NULL,
    `companyName` VARCHAR(255) NOT NULL,
    `userId` VARCHAR(128) NOT NULL,
    `userName` VARCHAR(255) NOT NULL,
    `userEmail` VARCHAR(255) NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `claims_status_idx`(`status`),
    INDEX `claims_companyId_idx`(`companyId`),
    INDEX `claims_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` VARCHAR(128) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(255) NOT NULL,

    INDEX `services_category_idx`(`category`),
    INDEX `services_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `institutions` (
    `id` VARCHAR(128) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `logo` TEXT NULL,
    `image` TEXT NULL,
    `category` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `responsiblePersonName` VARCHAR(255) NULL,
    `responsiblePersonTitle` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `website` VARCHAR(512) NULL,
    `whatsapp` VARCHAR(64) NULL,

    INDEX `institutions_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `procedures` (
    `id` VARCHAR(128) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `institutionId` VARCHAR(128) NULL,
    `institutionName` VARCHAR(255) NOT NULL,
    `requirements` JSON NOT NULL,
    `steps` JSON NOT NULL,
    `cost` VARCHAR(255) NOT NULL,
    `documents` JSON NOT NULL,

    INDEX `procedures_institutionId_idx`(`institutionId`),
    INDEX `procedures_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_postings` (
    `id` VARCHAR(128) NOT NULL,
    `companyId` VARCHAR(128) NOT NULL,
    `companyName` VARCHAR(255) NOT NULL,
    `companyLogo` TEXT NULL,
    `ownerId` VARCHAR(128) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `sector` VARCHAR(255) NOT NULL,
    `city` VARCHAR(128) NOT NULL,
    `employmentType` VARCHAR(64) NOT NULL,
    `salaryRange` VARCHAR(255) NULL,
    `requirements` JSON NOT NULL,
    `responsibilities` JSON NOT NULL,
    `academicLevel` VARCHAR(64) NULL,
    `experience` JSON NOT NULL,
    `skills` JSON NOT NULL,
    `applicationMethod` ENUM('email', 'link') NOT NULL,
    `applicationValue` VARCHAR(512) NOT NULL,
    `applicationInstructions` TEXT NULL,
    `status` ENUM('open', 'closed') NOT NULL DEFAULT 'open',
    `deadline` DATETIME(3) NULL,
    `applicationClickCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `job_postings_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `job_postings_companyId_idx`(`companyId`),
    INDEX `job_postings_ownerId_idx`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `id` VARCHAR(128) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(255) NOT NULL,
    `city` VARCHAR(128) NOT NULL,
    `address` VARCHAR(512) NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `organizerType` ENUM('company', 'institution') NOT NULL,
    `organizerId` VARCHAR(128) NOT NULL,
    `organizerName` VARCHAR(255) NOT NULL,
    `organizerLogo` TEXT NULL,
    `ownerId` VARCHAR(128) NULL,
    `registrationMethod` ENUM('email', 'link', 'none') NOT NULL DEFAULT 'none',
    `registrationValue` VARCHAR(512) NULL,
    `status` ENUM('scheduled', 'cancelled') NOT NULL DEFAULT 'scheduled',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `events_status_startDate_idx`(`status`, `startDate`),
    INDEX `events_organizerType_organizerId_idx`(`organizerType`, `organizerId`),
    INDEX `events_ownerId_idx`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tourist_locations` (
    `id` VARCHAR(128) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(128) NOT NULL,
    `address` VARCHAR(512) NOT NULL,
    `city` VARCHAR(128) NOT NULL,
    `lat` DOUBLE NULL,
    `lng` DOUBLE NULL,
    `image` TEXT NULL,
    `gallery` JSON NOT NULL,
    `priceRange` VARCHAR(8) NULL,
    `openingHours` JSON NOT NULL,
    `linkedCompanyId` VARCHAR(128) NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `submittedBy` VARCHAR(128) NOT NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tourist_locations_status_idx`(`status`),
    INDEX `tourist_locations_city_idx`(`city`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itineraries` (
    `id` VARCHAR(128) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `coverImage` TEXT NULL,
    `authorId` VARCHAR(128) NOT NULL,
    `authorName` VARCHAR(255) NOT NULL,
    `city` VARCHAR(128) NOT NULL,
    `durationDays` INTEGER NOT NULL,
    `theme` JSON NOT NULL,
    `visibility` ENUM('public', 'unlisted') NOT NULL DEFAULT 'public',
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `itineraries_visibility_idx`(`visibility`),
    INDEX `itineraries_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itinerary_stops` (
    `id` VARCHAR(128) NOT NULL,
    `itineraryId` VARCHAR(128) NOT NULL,
    `locationId` VARCHAR(128) NOT NULL,
    `locationType` ENUM('place', 'company') NOT NULL DEFAULT 'place',
    `order` INTEGER NOT NULL,
    `day` INTEGER NOT NULL,
    `suggestedTime` VARCHAR(64) NULL,
    `notes` TEXT NULL,

    INDEX `itinerary_stops_itineraryId_idx`(`itineraryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `health_facilities` (
    `id` VARCHAR(128) NOT NULL,
    `type` ENUM('hospital', 'clinic', 'pharmacy') NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `ownership` ENUM('public', 'private') NOT NULL,
    `description` TEXT NOT NULL,
    `services` JSON NOT NULL,
    `specialties` JSON NOT NULL,
    `emergencyServices` BOOLEAN NOT NULL DEFAULT false,
    `whatsapp` VARCHAR(64) NULL,
    `image` TEXT NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `health_facilities_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pharmacy_duty_dates` (
    `facilityId` VARCHAR(128) NOT NULL,
    `date` DATE NOT NULL,

    INDEX `pharmacy_duty_dates_date_idx`(`date`),
    PRIMARY KEY (`facilityId`, `date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `professionals` (
    `id` VARCHAR(128) NOT NULL,
    `ownerId` VARCHAR(128) NOT NULL,
    `displayName` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `photo` TEXT NULL,
    `bio` TEXT NOT NULL,
    `category` VARCHAR(255) NOT NULL,
    `skills` JSON NOT NULL,
    `services` JSON NOT NULL,
    `portfolio` JSON NOT NULL,
    `city` VARCHAR(128) NOT NULL,
    `availability` ENUM('Disponible', 'Ocupado', 'A demanda') NULL,
    `phone` VARCHAR(64) NULL,
    `whatsapp` VARCHAR(64) NULL,
    `email` VARCHAR(255) NULL,
    `linkedin` VARCHAR(512) NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `professionals_ownerId_idx`(`ownerId`),
    INDEX `professionals_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
    `id` VARCHAR(128) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `excerpt` TEXT NOT NULL,
    `featuredImage` TEXT NULL,
    `imageDescription` VARCHAR(512) NULL,
    `authorId` VARCHAR(128) NOT NULL,
    `authorName` VARCHAR(255) NOT NULL,
    `category` VARCHAR(255) NULL,
    `status` ENUM('draft', 'pending', 'published') NOT NULL DEFAULT 'draft',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `posts_slug_key`(`slug`),
    INDEX `posts_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_comments` (
    `id` VARCHAR(128) NOT NULL,
    `postId` VARCHAR(128) NOT NULL,
    `userId` VARCHAR(128) NOT NULL,
    `authorName` VARCHAR(255) NOT NULL,
    `comment` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `post_comments_postId_idx`(`postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menu_items` (
    `id` VARCHAR(128) NOT NULL,
    `companyId` VARCHAR(128) NOT NULL,
    `companyName` VARCHAR(255) NOT NULL,
    `ownerId` VARCHAR(128) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `image` TEXT NULL,
    `foodType` VARCHAR(128) NOT NULL,
    `isMenuDelDia` BOOLEAN NOT NULL DEFAULT false,
    `available` BOOLEAN NOT NULL DEFAULT true,
    `optionGroups` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `menu_items_companyId_idx`(`companyId`),
    INDEX `menu_items_available_isMenuDelDia_idx`(`available`, `isMenuDelDia`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `food_orders` (
    `id` VARCHAR(128) NOT NULL,
    `companyId` VARCHAR(128) NOT NULL,
    `companyName` VARCHAR(255) NOT NULL,
    `customerId` VARCHAR(128) NULL,
    `customerName` VARCHAR(255) NOT NULL,
    `customerPhone` VARCHAR(64) NOT NULL,
    `items` JSON NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `deliveryMethod` ENUM('pickup', 'situka') NOT NULL,
    `deliveryAddress` VARCHAR(512) NULL,
    `paymentMethod` ENUM('none', 'muni_dinero') NOT NULL DEFAULT 'none',
    `paymentStatus` ENUM('not_applicable', 'pending', 'paid') NOT NULL DEFAULT 'not_applicable',
    `commissionPercent` DECIMAL(5, 2) NOT NULL,
    `commissionAmount` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('placed', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'placed',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `food_orders_companyId_createdAt_idx`(`companyId`, `createdAt`),
    INDEX `food_orders_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `site_settings` (
    `id` VARCHAR(32) NOT NULL DEFAULT 'main',
    `siteName` VARCHAR(255) NOT NULL,
    `siteSlogan` VARCHAR(512) NOT NULL,
    `logoUrl` TEXT NULL,
    `cities` JSON NOT NULL,
    `isBusinessAdvisorEnabled` BOOLEAN NOT NULL DEFAULT false,
    `socialMedia` JSON NULL,
    `foodDeliveryFees` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_favorites` ADD CONSTRAINT `user_favorites_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_subscriptions` ADD CONSTRAINT `user_subscriptions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fcm_tokens` ADD CONSTRAINT `fcm_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `branches` ADD CONSTRAINT `branches_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `branches` ADD CONSTRAINT `branches_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `branches` ADD CONSTRAINT `branches_healthFacilityId_fkey` FOREIGN KEY (`healthFacilityId`) REFERENCES `health_facilities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `companies` ADD CONSTRAINT `companies_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_announcements` ADD CONSTRAINT `company_announcements_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_offers` ADD CONSTRAINT `company_offers_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claims` ADD CONSTRAINT `claims_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claims` ADD CONSTRAINT `claims_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procedures` ADD CONSTRAINT `procedures_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_postings` ADD CONSTRAINT `job_postings_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tourist_locations` ADD CONSTRAINT `tourist_locations_linkedCompanyId_fkey` FOREIGN KEY (`linkedCompanyId`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itineraries` ADD CONSTRAINT `itineraries_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itinerary_stops` ADD CONSTRAINT `itinerary_stops_itineraryId_fkey` FOREIGN KEY (`itineraryId`) REFERENCES `itineraries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pharmacy_duty_dates` ADD CONSTRAINT `pharmacy_duty_dates_facilityId_fkey` FOREIGN KEY (`facilityId`) REFERENCES `health_facilities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `professionals` ADD CONSTRAINT `professionals_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_comments` ADD CONSTRAINT `post_comments_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_comments` ADD CONSTRAINT `post_comments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `menu_items` ADD CONSTRAINT `menu_items_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `food_orders` ADD CONSTRAINT `food_orders_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `food_orders` ADD CONSTRAINT `food_orders_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

