import { Construct } from 'constructs';
import { Chart, ChartProps } from 'cdk8s';
import { ReactApplication, DjangoApplication, RedisApplication, CronJob } from '@pennlabs/kittyhawk';

const cronTime = require('cron-time-generator');

// Courses Demo
export class CoursesChart extends Chart {
  constructor(scope: Construct, id: string, props: ChartProps = { }) {
    super(scope, id, props);

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
      ingressPaths: ['/api', '/admin', '/accounts', '/assets', '/webhook'],
      ingressProps: {
        annotations: { ['ingress.kubernetes.io/content-security-policy']: "frame-ancestors 'none';" },
      },
      domains: [{ host: 'penncourseplan.com' },
        { host: 'penncoursealert.com' },
        { host: 'penncoursereview.com' }],
    });

    new ReactApplication(this, 'landing', {
      deployment: {
        image: 'pennlabs/pcx-landing',
      },
      domain: 'penncourses.org',
      ingressPaths: ['/'],
    });

    new ReactApplication(this, 'plan', {
      deployment: {
        image: 'pennlabs/pcp-frontend',
      },
      domain: 'penncourseplan.com',
      ingressPaths: ['/'],
    });

    new ReactApplication(this, 'alert', {
      deployment: {
        image: 'pennlabs/pca-frontend',
      },
      domain: 'penncoursealert.com',
      ingressPaths: ['/'],
    });

    new ReactApplication(this, 'review', {
      deployment: {
        image: 'pennlabs/pcr-frontend',
      },
      domain: 'penncoursereview.com',
      ingressPaths: ['/'],
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

