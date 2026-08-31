@echo off
set FABRICA_REUSE_PREPARED_NATIVE_RUNTIME=1
cd /d C:\Users\BAB AL SAFA\Desktop\Fabrica-development_environment\Fabrica-app
call pnpm exec electron-builder --config config/electron-builder.config.cjs --win
