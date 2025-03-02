#!/usr/bin/env bash

curl -O https://dl.typesense.org/releases/28.0/typesense-server-28.0-amd64.deb
sudo dpkg -i typesense-server-28.0-amd64.deb
sudo systemctl start typesense-server
sudo systemctl enable typesense-server
