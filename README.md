# 🛡️ Market Escrow System

**Market Escrow System** là một giải pháp TMĐT phi tập trung, kết hợp giữa thanh toán Web3 và quy trình quản lý đơn hàng truyền thống. Hệ thống đảm bảo tính minh bạch bằng cách giữ tiền trong Smart Contract và chỉ giải ngân khi giao dịch hoàn tất.

---

## 🚀 Luồng vận hành chính (Core Workflow)

Dưới đây là hành trình của một giao dịch từ khi bắt đầu đến khi tiền về túi người bán:

1. **Khởi tạo thanh toán:**
   - Người mua chọn sản phẩm và thanh toán bằng **ETH** thông qua MetaMask.
   - Tiền được chuyển vào **Smart Contract Escrow** và giữ ở trạng thái `Pending`.

2. **Đồng bộ hóa (Auto Sync):**
   - **Backend Service** lắng nghe sự kiện từ Blockchain. Khi xác nhận tiền đã vào Contract, hệ thống tự động:
     - Tạo hồ sơ giao dịch trong Database.
     - **Đồng bộ sang Shopify:** Tự động tạo một đơn hàng ở trạng thái "Paid" trên hệ thống Shopify Admin của người bán để bắt đầu quy trình đóng gói.

3. **Giao hàng & Vận chuyển:**
   - Người bán xử lý đơn hàng trên Shopify hoặc Dashboard của hệ thống.
   - Trạng thái vận chuyển được cập nhật liên tục cho người mua.

4. **Giải ngân (Release Funds):**
   - Khi hàng được giao thành công (hoặc người mua xác nhận thủ công), hệ thống sẽ kích hoạt lệnh `release`.
   - Smart Contract tự động chuyển tiền từ địa chỉ ký quỹ sang **Ví nhận tiền của người bán**.
   - Nếu có tranh chấp, Quản trị viên có quyền can thiệp để `refund` (hoàn tiền) cho người mua.

---

## 🛠️ Xử lý Logic Kỹ thuật

### 1. Cơ chế giám sát Blockchain (Monitoring Service)
Hệ thống sử dụng một Background Worker chạy liên tục để quét các block:
- **Lọc Event:** Theo dõi các sự kiện `EscrowCreated` và `EscrowAction`.
- **Reconciliation:** Đảm bảo dữ liệu giữa Blockchain và Cơ sở dữ liệu (MongoDB) luôn khớp nhau. Nếu giao dịch thất bại trên chuỗi, đơn hàng trên hệ thống sẽ không được tạo.

### 2. Tích hợp Shopify Admin API
Thay vì chỉ dừng lại ở Web3, hệ thống kết nối trực tiếp với Shopify:
- Tự động map dữ liệu sản phẩm.
- Ghi chú thông tin Transaction Hash và địa chỉ ví người mua trực tiếp vào Order Note trên Shopify để đối soát.

### 3. Bảo mật Ký quỹ (On-chain Security)
- **Non-custodial:** Tiền không nằm trong tài khoản của sàn mà nằm trực tiếp trong Smart Contract đã được mã hóa.
- **Admin Multisig (Chế độ Quản trị):** Quyền giải ngân chỉ thuộc về Buyer hoặc Admin trong trường hợp cần hỗ trợ tranh chấp.

---

## ✨ Các tính năng chính

### Đối với Người mua (Buyer)
- **Thanh toán Web3:** Trải nghiệm thanh toán nhanh gọn qua ví MetaMask/Coinbase.
- **Theo dõi đơn hàng:** Xem trạng thái thực tế của đơn hàng từ lúc ký quỹ đến lúc nhận hàng.
- **Khiếu nại/Hoàn tiền:** Bảo vệ quyền lợi nếu người bán không giao hàng.

### Đối với Người bán (Seller)
- **Quản lý Dashboard:** Theo dõi doanh thu, số dư đang ký quỹ và lịch sử giao dịch.
- **Đồng bộ tự động:** Không cần tạo đơn hàng thủ công, mọi thứ từ Web3 được đẩy thẳng về Shopify.
- **Nhận tiền an toàn:** Tiền về ví ngay lập tức sau khi buyer xác nhận.

### Đối với Quản trị viên (Admin)
- **Xử lý tranh chấp:** Quyền `release` hoặc `refund` dựa trên bằng chứng giao dịch.
- **Giám sát hệ thống:** Theo dõi toàn bộ dòng tiền và các giao dịch đang treo trên sàn.

---

## 💻 Công nghệ cốt lõi
- **Core:** Node.js, TypeScript, React (Next.js).
- **Web3:** Solidity, Hardhat, Ethers.js.
- **Database:** MongoDB (Mongoose).
- **Third-party:** Shopify Admin Rest API.

---
*Phát triển bởi [buiquocnam](https://github.com/buiquocnam) - Nền tảng TMĐT Web3 tin cậy.*
