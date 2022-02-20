import { Construct } from 'constructs';
import { App, Chart, ChartProps } from 'cdk8s';
import { ReactApplication, DjangoApplication, CronJob, NonEmptyArray } from '@pennlabs/kittyhawk';

const cronTime = require('cron-time-generator');

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
        cmd: ['/usr/local/bin/asgi-run'],
        replicas: 2,
      },
      // TODO: are any of these subdomains?
      domains: [
        { host: 'studentlife.pennlabs.org' },
        { host: 'pennmobile.org' },
        { host: 'portal.pennmobile.org' }] as NonEmptyArray<{ host: string; isSubdomain?: boolean }>,
      // TODO: it seems to be configuring these paths for all of the domains, which is kinda sus
      ingressPaths: ['/','/api', '/assets'],
      djangoSettingsModule: 'pennmobile.settings.production',
    });

    new ReactApplication(this, 'react', {
      deployment: {
        image: frontendImage,
      },
      domain: "portal.pennmobile.org",
      ingressPaths: ['/'],
    });

    new CronJob(this, 'get-laundry-snapshots', {
      schedule: cronTime.everyHourAt(15),
      image: backendImage,
      secret,
      cmd: ["python", "manage.py", "get_snapshot"],
      env: [{ name: "DJANGO_SETTINGS_MODULE", value: "pennmobile.settings.production"}]
    });
  }
}

const app = new App();
new MyChart(app, 'penn-mobile');
app.synth();





