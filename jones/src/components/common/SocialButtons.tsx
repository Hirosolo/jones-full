import Link from "next/link";
import {
  RiFacebookBoxFill,
  RiInstagramFill,
  RiYoutubeFill,
  RiTwitterFill,
  RiPinterestFill,
  RiGithubFill,
} from "react-icons/ri";
import { SiTiktok } from "react-icons/si";

interface SocialLinkItem {
  platform: string;
  url: string;
  visible?: boolean;
}

const PLATFORM_ICON: Record<string, JSX.Element> = {
  facebook: <RiFacebookBoxFill />,
  instagram: <RiInstagramFill />,
  youtube: <RiYoutubeFill />,
  twitter: <RiTwitterFill />,
  pinterest: <RiPinterestFill />,
  github: <RiGithubFill />,
  tiktok: <SiTiktok />,
};

export default function SocialButtons({ vertical, size = "sm", links }: PropTypes) {
  const items = (links || []).filter(link => link?.visible !== false && !!link?.url);

  return (
    <div
      className={`social-links${
        vertical ? " social-links--vertical " : " "
      }social-links--${size}`}
    >
      {items.map((item, index) => {
        const platform = String(item.platform || "").toLowerCase();
        const icon = PLATFORM_ICON[platform] || <RiGithubFill />;
        const isTikTok = platform === "tiktok";

        return (
          <Link key={`${platform}-${index}`} href={item.url}>
            <a
              aria-label={`Follow us on ${platform}`}
              className={`social-links__link${isTikTok ? " social-links__link--tiktok" : ""}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {icon}
            </a>
          </Link>
        );
      })}
    </div>
  );
}

interface PropTypes {
  vertical?: boolean;
  size?: "sm" | "md" | "lg";
  links?: SocialLinkItem[];
}
