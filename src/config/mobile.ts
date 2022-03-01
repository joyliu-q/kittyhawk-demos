import { Construct } from 'constructs';
import { Chart, ChartProps } from 'cdk8s';
import { ReactApplication, DjangoApplication, CronJob } from '@pennlabs/kittyhawk';

const cronTime = require('cron-time-generator');

// Mobile Demo
export class MobileChart extends Chart {
  constructor(scope: Construct, id: string, props: ChartProps = { }) {
    super(scope, id, props);

    const secret = "penn-mobile";
    const backendImage = "pennlabs/penn-mobile-backend"
    const frontendImage = "pennlabs/penn-mobile-frontend"

    new DjangoApplication(this, 'django', {
      deployment: {
        image: backendImage,
        secret,
        replicas: 1,
      },
      // TODO: are any of these subdomains?
      domains: [
        { host: 'studentlife.pennlabs.org', isSubdomain: true, paths: ['/']},
        { host: 'portal.pennmobile.org', isSubdomain: true, paths: ['/api', '/assets'] },
        { host: 'pennmobile.org', paths: ['/api', '/assets']},
      ],
      djangoSettingsModule: 'pennmobile.settings.production',
    });

    new ReactApplication(this, 'react', {
      deployment: {
        image: frontendImage,
      },
      domain: "portal.pennmobile.org",
      isSubdomain: true,
      paths: ['/'],
    });

    new CronJob(this, 'get-laundry-snapshots', {
      schedule: cronTime.every(15).minutes(),
      image: backendImage,
      secret,
      cmd: ["python", "manage.py", "get_snapshot"],
      env: [{ name: "DJANGO_SETTINGS_MODULE", value: "pennmobile.settings.production"}]
    });
  }
}2