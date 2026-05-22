# Deploying Admin to admin.medalino.ir

این راهنما توضیح می‌دهد چگونه پنل ادمین را روی سرور با دامنه `admin.medalino.ir` مستقر کنید.

پیش‌نیازها
- دسترسی SSH به سرور با دسترسی sudo
- دامنه `admin.medalino.ir` به آی‌پی سرور اشاره داشته باشد

مراحل سریع

1) کپی پروژه به سرور (در سرور):
```bash
# روی ماشین محلی
scp -r . root@85.198.23.48:/var/www/medalino
```

2) اجرای اسکریپت نصب و استقرار (روی سرور):
```bash
sudo bash /var/www/medalino/scripts/deploy-admin.sh /var/www/medalino admin.medalino.ir 3002
```

3) تنظیم متغیرهای محیطی در `/etc/medalino/admin.env` (مثال):
```ini
ADMIN_USERNAME=admin
ADMIN_PASSWORD=cloud@506070
ADMIN_AUTH_SECRET=put-a-long-random-secret-here
```

4) بررسی وضعیت سرویس:
```bash
sudo systemctl status medalino-admin.service
sudo journalctl -u medalino-admin.service -f
```

تست
- باز کردن https://admin.medalino.ir/login و تلاش برای ورود

نکات امنیتی
- `ADMIN_AUTH_SECRET` را با مقدار تصادفی و طولانی جایگزین کنید.
- رمز عبور `ADMIN_PASSWORD` را اگر عمومی است تغییر دهید.
