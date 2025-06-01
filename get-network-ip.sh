#\!/bin/bash
echo 'Mendapatkan IP address untuk akses network...'
echo 'Frontend akan tersedia di:'
echo 'http://localhost:3000 (lokal)'
ip route get 1.1.1.1  < /dev/null |  grep -oP 'src \K\S+' | head -1 | xargs -I {} echo 'http://{}:3000 (network)'
