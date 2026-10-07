import Loader from "../Loader";

export default function Skeleton() {
  return (
    <div className='absolute inset-0 bg-black flex flex-col items-center justify-center gap-5'>
      {/* Three bouncing dots */}
      <Loader />
    </div>
  );
}
