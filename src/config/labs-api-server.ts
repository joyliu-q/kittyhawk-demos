import { Construct } from 'constructs';
import { PennLabsChart, DjangoApplication, RedisApplication, CronJob } from '@pennlabs/kittyhawk/';

const cronTime = require('cron-time-generator');

export class LabsApiServerChart extends PennLabsChart {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const image = 'pennlabs/labs-api-server';
    const secret = 'labs-api-server';
    const domain = 'api.pennlabs.org';

    new DjangoApplication(this, 'flask', {
      deployment: {
        image,
        secret,
        secretMounts: [{ 
          name: "labs-api-server", 
          mountPath: '/app/ios_key.p8', 
          subPath: 'ios-key' 
        }],
      },
      domains: [{ 
        host: domain, 
        paths: ['/'], 
        isSubdomain: true
      }],
      djangoSettingsModule: 'labs_api_server.settings.production',
    });

    new RedisApplication(this, 'redis', {});

    new CronJob(this, 'laundry', {
      schedule: cronTime.every(15).minutes(),
      image,
      secret,
      cmd: ["python3", "cron/save_laundry_data.py"],
    });

    new CronJob(this, 'gsr-notifications', {
      schedule: "20,50 * * * *", //cronTime.every(20).minutes().and().every(50).minutes(),
      image,
      secret,
      cmd: ["python3", "cron/send_gsr_push_notifications.py"],
      secretMounts: [{
        name: "labs-api-server",
        mountPath: '/app/ios_key.p8',
        subPath: 'ios-key'
      }]
    });
  }
}