const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json()); // รองรับ JSON Request Body
app.use(express.urlencoded({ extended: true })); // รองรับ Form Data

// เชื่อมต่อ MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "crud-project",
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// ✅ สร้าง Schema สำหรับ Counter
const counterSchema = new mongoose.Schema({
  _id: String,
  sequence_value: Number,
});

const Counter = mongoose.model("Counter", counterSchema);

// ✅ ฟังก์ชันดึง `_id` ใหม่
async function getNextSequence(name) {
  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
}

// ✅ สร้าง Schema สำหรับ Demo และใช้ `_id` เป็น Number
const demoSchema = new mongoose.Schema({
  _id: Number, // เปลี่ยน `_id` เป็นตัวเลขแทน `ObjectId`
  Name: String,
  Description: String,
  Price: Number,
  Category: String,
});

const Demo = mongoose.model("Demo", demoSchema);

// ✅ GET ข้อมูลทั้งหมด
app.get("/demo", async (req, res) => {
  try {
    const search = req.query.search || ""; // ⬅️ รับค่าค้นหา
    const filter = search
      ? { Name: { $regex: search, $options: "i" } } // 🔍 ค้นหาชื่อสินค้าแบบ case-insensitive
      : {};

    const products = await Demo.find(filter);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "❌ Server error", details: error.message });
  }
});

// ✅ POST เพิ่มข้อมูลใหม่ และใช้ `_id` อัตโนมัติ
app.post("/demo", async (req, res) => {
  try {
    const { Name, Description, Price, Category } = req.body;

    const newDemo = new Demo({
      _id: await getNextSequence("productId"),
      Name,
      Description,
      Price,
      Category,
    });

    await newDemo.save();
    res.status(201).json({ message: "Data added successfully", demo: newDemo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ PUT อัปเดตข้อมูลทั้งหมด
app.put("/demo/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const updatedDemo = await Demo.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedDemo) {
      return res.status(404).json({ error: "Data not found" });
    }

    res.json({ message: "Data updated successfully", demo: updatedDemo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ PATCH อัปเดตเฉพาะบางฟิลด์
app.patch("/demo/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFields = req.body;

    const updatedDemo = await Demo.findByIdAndUpdate(id, updatedFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedDemo) {
      return res.status(404).json({ error: "Data not found" });
    }

    res.json({ message: "Data updated successfully", demo: updatedDemo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE ลบข้อมูลตาม ID
app.delete("/demo/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedDemo = await Demo.findByIdAndDelete(id);

    if (!deletedDemo) {
      return res.status(404).json({ error: "Data not found" });
    }

    res.json({ message: "✅ Data deleted successfully", demo: deletedDemo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE ลบข้อมูลตาม ID (แก้โค้ด)
app.post("/demo/delete", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "กรุณาส่งรายการ ID ที่ต้องการลบ" });
    }

    const result = await Demo.deleteMany({ _id: { $in: ids } });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลที่ต้องการลบ" });
    }

    res.json({ success: true, message: "ลบข้อมูลสำเร็จ!" });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// ✅ เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
