#!/bin/bash
export ConnectionStrings__DefaultConnection="Host=qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com;Port=5432;Database=qivr_dev;Username=qivr_user;Password=${DB_PASSWORD}"
dotnet ef migrations list --project Qivr.Infrastructure --startup-project Qivr.Api
