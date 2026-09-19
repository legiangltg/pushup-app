# HƯỚNG DẪN CÀI ĐẶT ỨNG DỤNG LÊN ANDROID & XUẤT FILE APK

> 🚀 **FILE APK ĐÃ ĐƯỢC BIÊN DỊCH SẴN SÀNG:**  
> File: `PushUpPro.apk` (4.14 MB)  
> Đường dẫn: `C:\Users\LTG\.gemini\antigravity-ide\scratch\pushup-counter-app\PushUpPro.apk`  
> Bạn chỉ cần copy file này vào điện thoại Android qua Zalo / Telegram / Google Drive / Cáp USB và bấm cài đặt ngay!


Ứng dụng **PushUp Pro** được xây dựng theo tiêu chuẩn **PWA (Progressive Web App)** kết hợp **Web Audio / Haptics API**, được tối ưu hoá đặc biệt cho Android.

---

## CÁCH 1: Cài đặt trực tiếp lên điện thoại (Khuyên Dùng - Nhanh nhất 10 giây)

> 💡 **Ưu điểm**: Không cần tải file APK lằng nhằng, không bị cảnh báo "nguồn không xác định", có icon ngoài màn hình chính, mở lên toàn màn hình (full-screen không thanh địa chỉ), hoạt động 100% offline không cần mạng!

### Bước thực hiện:
1. Mở terminal tại máy tính và khởi chạy máy chủ cục bộ (xem mục Chạy Local bên dưới) hoặc tải thư mục lên GitHub Pages / Vercel (miễn phí 100%).
2. Trên điện thoại Android, mở trình duyệt **Google Chrome** và truy cập vào địa chỉ ứng dụng.
3. Bạn sẽ thấy thanh thông báo **"Cài đặt PushUp Pro"** hiện ngay trên ứng dụng, bấm **Cài Đặt**.  
   *(Hoặc bấm vào biểu tượng **3 dấu chấm** ở góc trên bên phải Chrome -> chọn **"Cài đặt ứng dụng"** hoặc **"Thêm vào màn hình chính"**)*.
4. Xong! Biểu tượng **PushUp Pro** màu cam đen thể thao sẽ xuất hiện trên màn hình chính của điện thoại.

---

## CÁCH 2: Xuất file cài đặt APK (`.apk`) chuẩn Android

Nếu bạn muốn có riêng file `.apk` để gửi cho bạn bè hoặc cài đặt bằng file:

### Cách nhanh nhất qua PWABuilder (Miễn phí của Microsoft / Google):
1. Đưa web của bạn lên mạng (qua Vercel / Netlify / GitHub Pages - hoàn toàn miễn phí chỉ 1 click).
2. Truy cập [pwabuilder.com](https://www.pwabuilder.com).
3. Dán đường link trang web của bạn vào ô và bấm **Start**.
4. Chọn **Android** -> bấm **Package**.
5. PWABuilder sẽ tự động tạo gói mã nguồn Android & cấp file **APK Signed** sẵn sàng tải về và cài đặt trực tiếp lên mọi điện thoại Android!

### Cách đóng gói offline bằng Capacitor:
Trong thư mục dự án, bạn có thể chạy:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "PushUp Pro" "com.fitness.pushuppro"
npx cap add android
npx cap open android
```
*(Yêu cầu máy có cài Android Studio để build file `.apk`)*.

---

## HƯỚNG DẪN SỬ DỤNG TẬP LUYỆN:
1. **Chọn Ngày tập**:
   - **Ngày 1**: Set 1 (30 cái), Set 2 (20 cái).
   - **Ngày 2**: Set 1 (30 cái), Set 2 (25 cái), Set 3 (3 cái).
   - Bạn có thể bấm nút **Sửa** hoặc **+ Thêm Ngày** để tạo lộ trình riêng.
2. **Bắt đầu tập**:
   - Đặt điện thoại nằm ngửa trên sàn nhà hoặc thảm yoga, vị trí thẳng dưới cằm/ngực.
   - Khi hạ người xuống thực hiện động tác chống đẩy, cằm hoặc chóp mũi chạm nhẹ vào màn hình.
   - Màn hình sẽ phát ra tiếng **Bíp** và rung phản hồi tức thì, đếm số rep chuẩn xác.
3. **Nghỉ giữa hiệp**:
   - Khi hoàn thành đủ số rep của hiệp, máy sẽ tự động chuyển sang chế độ đếm ngược thời gian nghỉ (30 giây) kèm chuông báo 3-2-1 để vào hiệp tiếp theo.

---

## CÁCH CHIA SẺ VÀ NHẬP GIÁO ÁN TỪ MÁY KHÁC:

Khi bạn đã tạo giáo án ưng ý trên một máy và muốn chuyển sang điện thoại hoặc máy khác, bạn có thể thực hiện theo 3 cách cực kỳ đơn giản:

### Cách 1: Chia sẻ qua Mã (Khuyên dùng khi gửi qua Zalo / Telegram / Messenger)
1. **Trên máy đã tạo giáo án:**
   - Tại mục **"Giáo Án Tập Theo Ngày"**, bấm nút **"Chia Sẻ / Nhập"**.
   - Bấm **"📋 Sao Chép Mã Giáo Án"** (mã sẽ được sao chép vào bộ nhớ tạm).
   - Gửi đoạn mã này qua Zalo/Telegram/tin nhắn sang máy kia.
2. **Trên máy / điện thoại cần nhận:**
   - Mở ứng dụng, bấm nút **"Chia Sẻ / Nhập"** -> Chuyển sang tab **"📥 Nhận (Nhập vào)"**.
   - Dán mã nhận được vào ô văn bản.
   - Chọn chế độ: **"Thay thế hoàn toàn"** hoặc **"Thêm tiếp vào sau các ngày hiện có"**.
   - Bấm **"Áp Dụng Giáo Án"**. Toàn bộ giáo án sẽ ngay lập tức được đồng bộ!

### Cách 2: Chia sẻ qua Đường Dẫn (Link nạp tự động)
1. Bấm **"Chia Sẻ / Nhập"** -> Bấm **"🔗 Sao Chép Link Nạp Tự Động"**.
2. Gửi link này cho máy kia.
3. Khi máy kia mở đường link, ứng dụng sẽ tự động phát hiện giáo án và hỏi: *"Phát hiện đường dẫn chia sẻ có X ngày giáo án! Bạn có muốn nạp vào máy ngay bây giờ không?"* -> Bấm **OK** là xong!

### Cách 3: Xuất và Nhập File `.JSON`
1. Bấm **"💾 Tải Về File (.JSON)"** để lưu file `giao-an-pushup.json` về máy tính hoặc bộ nhớ máy.
2. Gửi file này sang máy khác.
3. Ở máy nhận, bấm **"📁 Hoặc chọn file .JSON từ máy"**, chọn file vừa nhận và bấm **"Áp Dụng Giáo Án"**.

