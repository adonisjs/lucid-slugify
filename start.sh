#!/bin/bash

/wait-for-it.sh mysql:3306 && /wait-for-it.sh mysql_legacy:3306 && /wait-for-it.sh pg:5432 && /wait-for-it.sh mssql:1433 && npm run test:docker
