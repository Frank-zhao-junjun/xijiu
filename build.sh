#!/bin/bash
set -e
cd frontend && pnpm install && cd ..
pip3 install -r backend/requirements.txt
cd frontend && pnpm run build
