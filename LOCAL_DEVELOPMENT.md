# Yerel Geliştirme Akışı

Bu proje için normal geliştirme ve test işlemleri yerel ortamda yapılır. Uygulama geliştirme sırasında production Render veya Netlify verisini kullanmaz.

## Normal revizyon

1. GeoServer'ı manuel olarak başlatın ve `http://localhost:8080/geoserver` adresinde çalıştığından emin olun.
2. Proje klasöründeki `START_LOCAL_DIVE_PLANNER.bat` dosyasına çift tıklayın.
3. Uygulama otomatik olarak `http://127.0.0.1:4173` adresinde açılır.
4. Codex değişiklikleri feature branch üzerinde yapar; masaüstü ve mobil kontroller yerel uygulamada gerçekleştirilir.
5. Build ve gerekli testler çalıştırılır. Değişiklikler feature branch'e commit/push edilir; production'a deploy edilmez.

Launcher yalnızca yerel GeoServer'ı kontrol eder ve Vite geliştirme sunucusunu başlatır. Netlify, Render veya başka bir production servisine deploy komutu çalıştırmaz.

## Telefonda test

Telefon ve bilgisayar aynı Wi-Fi ağına bağlı olmalıdır. Launcher çalıştığında terminalde güncel telefon adresi gösterilir:

```text
http://<bilgisayarın-güncel-LAN-IP-adresi>:4173
```

Bu bilgisayarda belge oluşturulurken görülen adres `http://192.168.20.122:4173` idi. DHCP nedeniyle IP değişebileceği için her çalıştırmada launcher'ın gösterdiği adresi kullanın.

Windows Firewall izin isterse yalnızca **Private Networks (Özel Ağlar)** için erişime izin verin. Public Networks seçeneğini açmayın.

Vite'ı durdurmak için açılan `Florida Keys Dive Planner - Vite` penceresinde `Ctrl+C` tuşlarına basın veya pencereyi kapatın. GeoServer ayrı olarak manuel yönetilir.

## Yerel veri yolu

```text
Tarayıcı
→ React / Vite (127.0.0.1:4173)
→ /geoserver/*
→ Vite development proxy
→ localhost:8080/geoserver/*
→ yerel GeoServer
→ mevcut GeoPackage
```

React bileşenleri localhost adresi içermez; uygulama `/geoserver/...` isteklerini kullanmaya devam eder. `vite.config.ts` içindeki proxy bu istekleri yalnızca geliştirme sırasında yerel GeoServer'a yönlendirir. Production yönlendirmesi değişmemiştir.

## Final release

Final release yalnızca Kenan açıkça onayladıktan sonra ayrı bir görevde yapılır:

1. Onaylanan feature branch test edilir ve `main` ile birleştirilir.
2. Production deployment ayrı görevde başlatılır ve canlı ortam doğrulanır.

**Git commit/push production deployment değildir.** Normal revizyonlarda `main` merge veya production deploy yapılmaz.
