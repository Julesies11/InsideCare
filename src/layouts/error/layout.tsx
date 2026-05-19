import { Outlet } from 'react-router';

export function ErrorLayout() {
  return (
    <div className="flex flex-col items-center justify-center grow h-[95%]">
      <Outlet />
    </div>
  );
}
