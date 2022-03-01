import { Construct } from 'constructs';
import { App, Chart, ChartProps } from 'cdk8s';
import { ReactApplication, DjangoApplication, CronJob, NonEmptyArray } from '@pennlabs/kittyhawk';

const cronTime = require('cron-time-generator');

// Mobile Demo
export class MyChart extends Chart {
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
        { host: 'pennmobile.org' },
        { host: 'studentlife.pennlabs.org', isSubdomain: true },
        { host: 'portal.pennmobile.org', isSubdomain: true }] as NonEmptyArray<{ host: string; isSubdomain?: boolean }>,
      ingressPaths: ['/','/api', '/assets'],
      djangoSettingsModule: 'pennmobile.settings.production',
    });

    new ReactApplication(this, 'react', {
      deployment: {
        image: frontendImage,
      },
      domain: "portal.pennmobile.org",
      isSubdomain: true,
      ingressPaths: ['/'],
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

const app = new App();
new MyChart(app, 'penn-mobile');
app.synth();





