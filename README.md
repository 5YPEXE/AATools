# AATools Office Suite 🛠️

AATools, veritabanı analizleri, coğrafi harita görüntüleme, ofis operasyonları ve dosya yönetimi gibi süreçleri tek bir merkezden yönetmek için geliştirilmiş kapsamlı bir ofis aracı platformudur.

## Özellikler (Modüller)

AATools, farklı alanlardaki ihtiyaçları karşılamak üzere çeşitli modüllere ayrılmıştır:

- **Harita ve Ulaşım:** Güzergah, hat ve durak verilerinin harita üzerinde dinamik olarak görselleştirilmesi.
- **Veritabanı Analizi:** Farklı SQLite/SQL veritabanlarını karşılaştırma, sorgu çalıştırma ve temizleme işlemleri (SQL Playground, DB Comparator).
- **Dosya Araçları:** PDF birleştirme/bölme/çıkarma, Excel (XLSX/CSV) işleme araçları ve evrensel dosya dönüştürücüler.
- **Görev ve Proje Yönetimi:** Kanban panoları, görev raporları ve aktivite takibi.
- **Metin Karşılaştırıcı:** Farklı metin blokları arasındaki farkları tespit etme (Diff checker).
- **Profil ve Kullanıcı Yönetimi:** Rol bazlı yetkilendirme (Admin, Lider, Kullanıcı) ve profil özelleştirme.

## Teknolojik Altyapı

Proje modern ve hızlı çalışan bir mimari üzerinde inşa edilmiştir:

- **Frontend:** React (Vite tabanlı), CSS3 (Glassmorphism & Modern UI), Lucide Icons
- **Backend:** Node.js, Express.js
- **Veritabanı (Veri kaynağı):** SQLite
- **Python Entegrasyonu:** Arka planda özel hesaplamalar için ayrıştırılmış Python çalıştırıcısı (Gömülü Python)

## Kurulum ve Çalıştırma

Projeyi yerel bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyebilirsiniz. *(Not: Hat ve Ücret (Lines/Fares) verileri güvenlik nedeniyle bu repoda bulunmamaktadır, ilgili modüllerin tam kapasite çalışması için gerekli `.sqlite` veri dosyalarını kök dizine manuel olarak eklemelisiniz).*

1. **Bağımlılıkları Yükleyin**
```bash
# Frontend için
cd client
npm install

# Backend için
cd ../server
npm install
```

2. **Geliştirme Sunucusunu Başlatın**
```bash
# Ayrı terminallerde hem client hem de server'ı ayağa kaldırabilirsiniz:

# Terminal 1: Backend
cd server
npm start

# Terminal 2: Frontend
cd client
npm run dev
```

Uygulama `http://localhost:5173` (veya Vite'in sağladığı port) üzerinden ayağa kalkacaktır.
