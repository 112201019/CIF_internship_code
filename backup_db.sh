#!/bin/bash

# ==============================================================================
# HOW TO USE THIS SCRIPT
#
# 1. Make the Script Executable (One-Time Setup):
#    Open a terminal in the folder where this script is saved and run:
#    chmod +x backup_db.sh
#
# 2. Run the Script:
#    Navigate to any folder where you want to create the backup file,
#    then run the script using its full path or by placing it there.
#    Example: ./backup_db.sh
#
#    The script will ask for your password to run sudo commands and will
#    create the .dump file in your current directory.
# ==============================================================================

# --- Configuration: Change these values if needed ---
DB_NAME="cif"
BACKUP_FILENAME="cif.dump"
# ---------------------------------------------------

# Exit immediately if any command fails
set -e

# Create the backup as the 'postgres' user in a temporary directory
sudo -u postgres pg_dump -Fc -f "/tmp/$BACKUP_FILENAME" "$DB_NAME"

# Move the backup from the temporary directory to the current directory
sudo mv "/tmp/$BACKUP_FILENAME" .

# Change the backup file's ownership to the user who ran the script
sudo chown "$(whoami)":"$(whoami)" "$BACKUP_FILENAME"

echo "✅ Backup successful: $BACKUP_FILENAME created."
