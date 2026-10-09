-- AlterTable
ALTER TABLE `site_settings` ADD COLUMN `assistant` JSON NULL;

-- CreateTable
CREATE TABLE `assistant_entries` (
    `id` VARCHAR(128) NOT NULL,
    `question` VARCHAR(500) NOT NULL,
    `answer` TEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assistant_logs` (
    `id` VARCHAR(128) NOT NULL,
    `userId` VARCHAR(128) NULL,
    `ipHash` VARCHAR(64) NULL,
    `question` TEXT NOT NULL,
    `answer` TEXT NOT NULL,
    `answered` BOOLEAN NOT NULL DEFAULT true,
    `handled` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `assistant_logs_createdAt_idx`(`createdAt`),
    INDEX `assistant_logs_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `assistant_logs_ipHash_createdAt_idx`(`ipHash`, `createdAt`),
    INDEX `assistant_logs_answered_handled_idx`(`answered`, `handled`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

