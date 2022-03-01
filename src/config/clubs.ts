import { Construct } from 'constructs';
import { Chart, ChartProps } from 'cdk8s';
import { ReactApplication, DjangoApplication, RedisApplication, CronJob } from '@pennlabs/kittyhawk';

const cronTime = require('cron-time-generator');

export class ClubsChart extends Chart {
  constructor(scope: Construct, id: string, props: ChartProps = { }) {
    super(scope, id, props);

    const backendImage = 'pennlabs/penn-clubs-backend';
    const clubsSecret = 'penn-clubs';
    const fyhSecret = 'first-year-hub';
    const clubsDomain = 'pennclubs.com';
    const fyhDomain = 'hub.provost.upenn.edu';

    const clubsDjangoCommon = {
      deployment: {
        image: backendImage,
        env: [
          { name: 'REDIS_HOST', value: 'penn-clubs-redis' },
        ],
      },
      secret: clubsSecret,
      djangoSettingsModule: 'pennclubs.settings.production',
    };

    const fyhDjangoCommon = {
      deployment: {
        image: backendImage,
        env: [
          { name: 'REDIS_HOST', value: 'penn-clubs-hub-redis' },
          { name: 'NEXT_PUBLIC_SITE_NAME', value: 'fyh' },
        ],
      },
      secret: fyhSecret,
      djangoSettingsModule: 'pennclubs.settings.production',
    };


    new RedisApplication(this, 'redis', {});

    new DjangoApplication(this, 'django-asgi', {
      ...clubsDjangoCommon,
      deployment: {
        image: clubsDjangoCommon.deployment.image,
        cmd: ['/usr/local/bin/asgi-run'],
        replicas: 2,
      },
      domains: [{ host: clubsDomain, paths: ['/api/ws']}],
    });

    new DjangoApplication(this, 'django-wsgi', {
      ...clubsDjangoCommon,
      deployment: {
        image: clubsDjangoCommon.deployment.image,
        replicas: 5,
      },
      domains: [{ host: clubsDomain, paths: ['/api']}],
    });

    new ReactApplication(this, 'react', {
      deployment: {
        image: 'pennlabs/penn-clubs-frontend',
        replicas: 2,
      },
      domain: { host: clubsDomain, paths: ['/'] },
      portEnv: '80',
    });

    /** FYH */

    new RedisApplication(this, 'hub-redis', {});

    new DjangoApplication(this, 'hub-django-asgi', {
      ...fyhDjangoCommon,
      deployment: {
        image: fyhDjangoCommon.deployment.image,
        cmd: ['/usr/local/bin/asgi-run'],
        replicas: 2,
      },
      domains: [{ host: fyhDomain, paths: ['/api/ws'] }],
    });

    new DjangoApplication(this, 'hub-django-wsgi', {
      ...fyhDjangoCommon,
      deployment: {
        image: backendImage,
        replicas: 3,
      },
      domains: [{ host: fyhDomain, paths: ['/api'] }],
    });


    new ReactApplication(this, 'hub-react', {
      deployment: {
        image: 'pennlabs/penn-clubs-frontend',
        replicas: 2,
        env: [
          { name: 'NEXT_PUBLIC_SITE_NAME', value: 'fyh' },
        ],
      },
      domain: { host: fyhDomain, paths: ['/'] },
      portEnv: '80',
    });

    /** Cronjobs **/

    new CronJob(this, 'rank-clubs', {
      schedule: cronTime.everyDayAt(8),
      image: backendImage,
      secret: clubsSecret,
      cmd: ['python', 'manage.py', 'rank'],
    });

    new CronJob(this, 'daily-notifications', {
      schedule: cronTime.everyDayAt(13),
      image: backendImage,
      secret: clubsSecret,
      cmd: ['python', 'manage.py', 'daily_notifications'],
    });

    new CronJob(this, 'hub-daily-notifications', {
      schedule: cronTime.everyDayAt(13),
      image: backendImage,
      secret: fyhSecret,
      cmd: ['python', 'manage.py', 'daily_notifications'],
    });

    new CronJob(this, 'calendar-import', {
      schedule: cronTime.everyDayAt(12),
      image: backendImage,
      secret: clubsSecret,
      cmd: ['python', 'manage.py', 'import_calendar_events'],
    });

    new CronJob(this, 'hub-calendar-import', {
      schedule: cronTime.everyDayAt(12),
      image: backendImage,
      secret: fyhSecret,
      cmd: ['python', 'manage.py', 'import_calendar_events'],
    });

    new CronJob(this, 'hub-paideia-calendar-import', {
      schedule: cronTime.everyDayAt(12),
      image: backendImage,
      secret: fyhSecret,
      cmd: ["python", "manage.py", "import_paideia_events"],
    });
  }
}