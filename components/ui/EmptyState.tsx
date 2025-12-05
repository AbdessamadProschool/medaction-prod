type EmptyStateProps = {
  icon: string;
  title: string;
  description: string;
};

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
//--------------------------------------------------------
//
//     EXEMPLE
//
//--------------------------------------------------------

      // if (!all.length) {
//   return (
//     <EmptyState
//       icon="🔍"
//       title="ما كاين حتى نتيجة"
//       description="جرب كلمات أخرى."
//     />
//   );
// }
