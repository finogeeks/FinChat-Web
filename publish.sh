#!/bin/bash
set -e

#1.取版本号
if [ -z "$version" ]; then
version=`git describe --abbrev=0 --tags`
fi

export VERSION=${version}

echo "======  发布版本： ${version} ======"

cd build && zip -q -r finstore.zip *
echo ""

echo "======= 正式版 ========"
curl -X POST -H "Cache-Control: no-cache" -F "file=@finstore.zip;type=application/zip" -F "version=${version}" -F "project=finstore" "https://api.finogeeks.club/desktop/publish/api/upload"
echo ""
echo "Zip 地址: https://api.finogeeks.club/desktop/publish/finstore/${version}.zip"
echo "访问地址 https://api.finogeeks.club/desktop/publish/finstore/home"
echo "==========================="
echo ""