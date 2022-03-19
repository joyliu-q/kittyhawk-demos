import { App } from 'cdk8s';
import { ClubsChart, CoursesChart, MobileChart, OHQChart } from './src/config';
import { BasicsChart } from './src/config/basics';

const app = new App();
const gitSha = process.env.GIT_SHA;

if (!gitSha) {
  throw new Error('GIT_SHA environment variable not set');
}

switch (process.env.RELEASE_NAME) {
  case 'penn-basics':
    process.env.GIT_SHA = "c257c5b875c179dbf108f85779c379830a2fc2a8";
    new BasicsChart(app, 'penn-basics');
    break;
  case 'penn-clubs':
    process.env.GIT_SHA = "TAG_FROM_CI";
    new ClubsChart(app, 'penn-clubs');
    break;
  case 'penn-courses':
    process.env.GIT_SHA = "TAG_FROM_CI";
    new CoursesChart(app, 'penn-courses');
    break;
  case 'penn-mobile':
    process.env.GIT_SHA = "TAG_FROM_CI";
    new MobileChart(app, 'penn-mobile');
    break;
  case 'ohq':
    process.env.GIT_SHA = "TAG_FROM_CI";
    new OHQChart(app, 'ohq');
    break;
  default:
      throw new Error(`Unknown chart name: ${process.env.RELEASE_NAME}`);
}
app.synth();