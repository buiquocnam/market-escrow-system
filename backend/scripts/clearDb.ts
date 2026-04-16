import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '../.env') });

// Ưu tiên sử dụng MONGO_URI như cấu hình chung của backend
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error("❌ Error: MONGO_URI is not defined in .env file.");
  process.exit(1);
}

/**
 * ⚠️ DANGEROUS: Clears all collections in the database
 */
async function clearDatabase() {
  try {
    console.log("⏳ Dang kết nối tới database để chuẩn bị xóa dữ liệu...");
    await mongoose.connect(MONGO_URI as string);
    console.log("✅ Kết nối thành công.");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Could not access database object.");
    }

    const collections = await db.listCollections().toArray();
    
    console.log(`🧹 Tìm thấy ${collections.length} collections. Bắt đầu xóa...`);

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      
      // Không xóa các collection hệ thống của MongoDB (như indexes, system.views)
      if (collectionName.startsWith('system.')) continue;

      console.log(`   - Đang xóa collection: ${collectionName}...`);
      await db.collection(collectionName).deleteMany({});
      console.log(`     ✅ Đã xóa toàn bộ dữ liệu trong [${collectionName}].`);
    }

    console.log("\n✨ HOÀN TẤT: Toàn bộ dữ liệu đã được dọn sạch.");
    console.log("🚀 Môi trường đã sẵn sàng để reset.");

  } catch (error: any) {
    console.error("❌ Error clearing database:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Thêm cảnh báo xác nhận visual
console.log("\n" + "!".repeat(50));
console.log("⚠️  CẢNH BÁO: HÀNH ĐỘNG NÀY SẼ XÓA TOÀN BỘ DỮ LIỆU!");
console.log("!".repeat(50) + "\n");

// Chạy script
clearDatabase();
