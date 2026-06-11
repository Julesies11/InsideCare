import { Link } from 'react-router';
import { toAbsoluteUrl } from '@/lib/helpers';

export function Error403() {
  return (
    <>
      <div className="mb-10">
        <img
          src={toAbsoluteUrl('/media/illustrations/17.svg')}
          className="dark:hidden max-h-[160px]"
          alt="image"
        />
        <img
          src={toAbsoluteUrl('/media/illustrations/17.svg')}
          className="hidden dark:block max-h-[160px]"
          alt="image"
        />
      </div>

      <span className="badge badge-danger badge-outline mb-3">
        403 Access Denied
      </span>

      <h3 className="text-2xl font-semibold text-mono text-center mb-2">
        You don't have permission to access this page
      </h3>

      <div className="text-base text-center text-secondary-foreground mb-10">
        Please contact your administrator if you believe this is an error.&nbsp;
        <Link
          to="/"
          className="text-primary font-medium hover:text-primary-active"
        >
          Return Home
        </Link>
        .
      </div>
    </>
  );
}
