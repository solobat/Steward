#!/bin/sh

# prepare
echo "准备目录......"
rm -fr output
mkdir -p output

# build
echo "编译中....."
npm run build:minified:plus || { echo "编译失败，请检查后重试"; exit 1; }

zip -r stewardplus.zip output/steward_plus/

echo "打包完毕"

mv -f stewardplus.zip ~/Desktop

echo "移动到桌面"