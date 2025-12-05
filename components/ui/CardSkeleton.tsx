export default function CardSkeleton() {
  return (
    <div className="animate-pulse bg-gray-200 h-52 rounded-xl" />
  );
}

//--------------------------------------------------------
//
//     EXEMPLE
//
//--------------------------------------------------------

{/* <Suspense fallback={
  <div className="grid grid-cols-3 gap-5">
    <CardSkeleton />
    <CardSkeleton />
    <CardSkeleton />
  </div>
}>
  <ContentList query={query} />
</Suspense> */}


