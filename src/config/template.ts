import { Construct } from 'constructs';
import { Chart, ChartProps } from 'cdk8s';
import { ReactApplication, DjangoApplication, RedisApplication, CronJob } from '@pennlabs/kittyhawk/';

const cronTime = require('cron-time-generator');

export class ChartName extends Chart {
  constructor(scope: Construct, id: string, props: ChartProps = {}) {
    super(scope, id, props);

    const backendImage = 'pennlabs/office-hours-queue-backend';
    const secret = 'office-hours-queue';
    const domain = 'ohq.io';
    const env = [
      { name: 'REDIS_URL', value: 'redis://your-redis-name:6379' },
      { name: 'OTHER_ENV', value: 'value' },
    ];

    new DjangoApplication(this, 'django', {
      deployment: {
        image: 'django-image-name',
        cmd: ['/your/django/command'],
        replicas: 4,
        secret,
        env,
      },
      djangoSettingsModule: 'name.settings.production',
      domains: [{ host: domain, paths: ['/api/ws'] }],
    });

    new ReactApplication(this, 'react', {
      deployment: {
        image: 'react-image-name',
        replicas: 2,
        secret,
        env,
      },
      domain: { host: domain, paths: ['/'] },
      portEnv: '80',
    });

    new RedisApplication(this, 'redis', {});

    new CronJob(this, 'cronjob-name', {
      schedule: cronTime.every(5).minutes(),
      image: backendImage,
      secret: secret,
      cmd: ['your', 'command', 'here'],
    });
  }
}