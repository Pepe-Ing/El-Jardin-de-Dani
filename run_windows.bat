@echo off
title Mi Floreria - servidor local
if not exist .venv (
  py -m venv .venv
)
call .venv\Scripts\activate
python -m pip install -r requirements.txt
set STORE_NAME=Mi Floreria
set WHATSAPP_NUMBER=51987654321
set DELIVERY_AREA=Trujillo y alrededores
set ADMIN_PASSWORD=CambiaEstaClave123!
set SECRET_KEY=pon-aqui-una-clave-larga-y-aleatoria
python app.py
pause
