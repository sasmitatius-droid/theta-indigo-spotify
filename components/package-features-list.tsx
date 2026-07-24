import { featureBulletText, isFeatureHeading } from '@/lib/parse-package-features';

export function PackageFeaturesList({ features }: { features: string[] }) {
  if (!features.length) return null;

  return (
    <ul className="space-y-1.5 text-sm text-slate-600">
      {features.map((line, index) => {
        if (isFeatureHeading(line)) {
          return (
            <li key={index} className="font-semibold text-slate-800 mt-2 list-none">
              {line}
            </li>
          );
        }
        const text = featureBulletText(line);
        const hasBullet = /^[\*\-•]/.test(line.trim());
        return (
          <li key={index} className={`flex gap-2 ${hasBullet || !isFeatureHeading(line) ? '' : ''}`}>
            <span className="text-indigo-500 shrink-0">•</span>
            <span>{text}</span>
          </li>
        );
      })}
    </ul>
  );
}
