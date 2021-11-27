import { Construct } from 'constructs';
import { App, Chart, ChartProps } from 'cdk8s';
import { ReactApplication, DjangoApplication, RedisApplication, CronJob } from '@pennlabs/kittyhawk';

const backendImage = 'pennlabs/office-hours-queue-backend';
const secret = 'office-hours-queue';
const domain = 'ohq.io';

const djangoCommon = {
  deployment: {
    image: backendImage,
    env: [
      { name: 'REDIS_URL', value: 'redis://office-hours-queue-redis:6379' },
    ],
  },
  secret: secret,
  djangoSettingsModule: 'officehoursqueue.settings.production',
  domains: [{ host: domain }],
};

export class MyChart extends Chart {
  constructor(scope: Construct, id: string, props: ChartProps = { }) {
    super(scope, id, props);

    // async stuff
    new DjangoApplication(this, 'django-asgi', {
      ...djangoCommon,
      deployment: {
        image: djangoCommon.deployment.image,
        cmd: ['/usr/local/bin/asgi-run'],
        replicas: 2,
      },
      ingressPaths: ['/api/ws'],
    });
    
    // regular http
    new DjangoApplication(this, 'django-wsgi', {
      ...djangoCommon,
      deployment: {
        image: djangoCommon.deployment.image,
        replicas: 4,
      },
      ingressPaths: ['/api', '/admin', '/assets'],
    });
    
    new ReactApplication(this, 'react', {
      deployment: {
        image: 'pennlabs/office-hours-queue-frontend',
        replicas: 2,
      },
      domain,
      ingressPaths: ['/'],
      portEnv: '80',
    });
    
    new RedisApplication(this, 'redis', {});
    
    new DjangoApplication(this, 'celery', {
      ...djangoCommon,
      deployment: {
        image: djangoCommon.deployment.image,
        cmd: ['celery', '-A', 'officehoursqueue', 'worker', '-lINFO'],
      }
    });
    
    new CronJob(this, 'calculate-waits', {
      schedule: "*/5 * * * *",
      image: backendImage,
      secret,
      cmd: ['python', 'manage.py', 'calculatewaittimes'],
    });
  }
}

const app = new App();
new MyChart(app, 'ohq');
app.synth();