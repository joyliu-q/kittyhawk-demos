import { Construct } from 'constructs';
import { PennLabsChart, ReactApplication, DjangoApplication, RedisApplication, CronJob } from '@pennlabs/kittyhawk';

const cronTime = require('cron-time-generator');

// Courses Demo
export class CoursesChart extends PennLabsChart {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const backendImage = 'pennlabs/penn-courses-backend';
    const secret = 'penn-courses';

    new RedisApplication(this, 'redis', { deployment: { tag: '4.0' } });

    new DjangoApplication(this, 'celery', {
      deployment: {
        image: backendImage,
        secret: secret,
        cmd: ['celery', 'worker', '-A', 'PennCourses', '-Q', 'alerts,celery', '-linfo'],
      },
      djangoSettingsModule: 'PennCourses.settings.production',
    });

    new DjangoApplication(this, 'backend', {
      deployment: {
        image: backendImage,
        secret: secret,
        cmd: ['celery', 'worker', '-A', 'PennCourses', '-Q', 'alerts,celery', '-linfo'],
        replicas: 3,
        env: [{ name: 'PORT', value: '80' }],
      },
      djangoSettingsModule: 'PennCourses.settings.production',
      ingressProps: {
        annotations: { ['ingress.kubernetes.io/content-security-policy']: "frame-ancestors 'none';" },
      },
      domains: [{ host: 'penncourseplan.com', paths: ["/api", "/admin", "/accounts", "/assets"] },
      { host: 'penncoursealert.com', paths: ["/api", "/admin", "/accounts", "/assets", "/webhook"] },
      { host: 'penncoursereview.com', paths: ["/api", "/admin", "/accounts", "/assets"] }],
    });

    new ReactApplication(this, 'landing', {
      deployment: {
        image: 'pennlabs/pcx-landing',
      },
      domain: { host: 'penncourses.org', paths: ['/'] },
    });

    new ReactApplication(this, 'plan', {
      deployment: {
        image: 'pennlabs/pcp-frontend',
      },
      domain: { host: 'penncourseplan.org', paths: ['/'] },
    });

    new ReactApplication(this, 'alert', {
      deployment: {
        image: 'pennlabs/pca-frontend',
      },
      domain: { host: 'penncoursealert.org', paths: ['/'] },
    });

    new ReactApplication(this, 'review', {
      deployment: {
        image: 'pennlabs/pcr-frontend',
      },
      domain: { host: 'penncoursereview.org', paths: ['/'] },
    });

    new CronJob(this, 'load-courses', {
      schedule: cronTime.everyDayAt(3),
      image: backendImage,
      secret: secret,
      cmd: ['python', 'manage.py', 'registrarimport'],
    });

    new CronJob(this, 'report-stats', {
      schedule: cronTime.everyDayAt(20),
      image: backendImage,
      secret: secret,
      cmd: ['python', 'manage.py', 'alertstats', '1', '--slack'],
    });
  }
}

