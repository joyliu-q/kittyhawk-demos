import { App } from 'cdk8s';
import { ClubsChart, CoursesChart, MobileChart, OHQChart } from './src/config';

const app = new App();
const gitSha = process.env.GIT_SHA;

if (!gitSha) {
  throw new Error('GIT_SHA environment variable not set');
}

switch (process.env.RELEASE_NAME) {
  case 'clubs':
    new ClubsChart(app, 'clubs');
    break;
  case 'courses':
    new CoursesChart(app, 'courses');
    break;
  case 'mobile':
    new MobileChart(app, 'mobile');
    break;
  case 'ohq':
    new OHQChart(app, 'ohq');
    break;
  default:
      throw new Error(`Unknown chart name: ${process.env.RELEASE_NAME}`);
}
app.synth();