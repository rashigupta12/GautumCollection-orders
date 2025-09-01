CREATE TYPE "public"."image_type" AS ENUM('ORDER_IMAGE', 'BILL_PHOTO');--> statement-breakpoint
ALTER TABLE "order_images" ADD COLUMN "type" "image_type" DEFAULT 'ORDER_IMAGE' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_order_number_unique" UNIQUE("order_number");