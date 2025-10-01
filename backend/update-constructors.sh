#!/bin/bash

echo "Updating NotificationsController constructor..."
sed -i '' '/public NotificationsController(/,/)$/{
    s/)$/): base(logger, context)/
}' Qivr.Api/Controllers/NotificationsController.cs

echo "Updating MedicalRecordsController constructor..."
sed -i '' '/public MedicalRecordsController(/,/)$/{
    s/)$/): base(logger, context)/
}' Qivr.Api/Controllers/MedicalRecordsController.cs

echo "Updating PromsController constructor..."
sed -i '' '/public PromsController(/,/)$/{
    s/)$/): base(logger, context)/
}' Qivr.Api/Controllers/PromsController.cs

echo "Updating ProfileController constructor..."
sed -i '' '/public ProfileController(/,/)$/{
    s/)$/): base(logger, context)/
}' Qivr.Api/Controllers/ProfileController.cs

echo "All constructors updated!"