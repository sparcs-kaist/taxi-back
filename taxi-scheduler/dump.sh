#!/bin/bash

S3PATH="s3://$BUCKET/$BACKUP_FOLDER"
printenv | sed 's/^\([a-zA-Z0-9_]*\)=\(.*\)$/export \1="\2"/g' | grep -E "^export AWS" > /root/project_env.sh

echo "=> Creating backup script"
rm -f /backup.sh
cat <<EOF >> /backup.sh
#!/bin/bash
TIMESTAMP=\`/bin/date +"%Y%m%dT%H%M%S"\`
BACKUP_NAME=\${TIMESTAMP}.dump.gz
S3BACKUP=${S3PATH}\${BACKUP_NAME}
echo "=> Backup started"
if mongodump --host ${MONGODB_HOST} --db ${DB_STR} --archive=\${BACKUP_NAME} --gzip && aws s3 cp \${BACKUP_NAME} \${S3BACKUP} && rm \${BACKUP_NAME} ;then
    echo "   > Backup succeeded"
else
    echo "   > Backup failed"
fi
echo "=> Done"
EOF
chmod +x /backup.sh

echo "=> Creating list script"
rm -f /listbackups.sh
cat <<EOF >> /listbackups.sh
#!/bin/bash
aws s3 ls ${S3PATH}
EOF
chmod +x /listbackups.sh
echo "=> List script created"

touch /mongo_backup.log

echo "${CRON_TIME} . /root/project_env.sh; /backup.sh >> /mongo_backup.log 2>&1" > /crontab.conf
crontab  /crontab.conf
echo "=> Running cron job"
cron && tail -f /mongo_backup.log