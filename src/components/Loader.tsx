"use client";

export default function Loader() {
  return <div className='loader' aria-label='Loading' role='status' />;
}

export function LoaderBlack() {
  return (
    <div className='loader loader--black' aria-label='Loading' role='status' />
  );
}
