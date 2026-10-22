import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import {
	Archive04Icon,
	ArrowDown,
	ArrowRight,
	ArrowUp,
	ArrowUpRight01Icon,
	Calendar03Icon,
	CommandIcon,
	LayoutAlignLeftIcon,
	Search as SearchIcon,
	Settings01Icon,
} from "@hugeicons/core-free-icons";
import type { ComponentProps } from "react";

export type IconProps = Omit<ComponentProps<typeof HugeiconsIcon>, "icon">;

export function withDefaultIconSize({ size = "var(--icon-md)", ...props }: IconProps): IconProps {
	return { size, ...props };
}

export const Search = (props: IconProps) => (
	<HugeiconsIcon icon={SearchIcon} {...withDefaultIconSize(props)} />
);
export const Command = (props: IconProps) => (
	<HugeiconsIcon icon={CommandIcon} {...withDefaultIconSize(props)} />
);
export const ArrowUpRight = (props: IconProps) => (
	<HugeiconsIcon icon={ArrowUpRight01Icon} {...withDefaultIconSize(props)} />
);
export const ChevronRight = (props: IconProps) => (
	<HugeiconsIcon icon={ArrowRight} {...withDefaultIconSize(props)} />
);
export const ChevronUp = (props: IconProps) => (
	<HugeiconsIcon icon={ArrowUp} {...withDefaultIconSize(props)} />
);
export const ChevronDown = (props: IconProps) => (
	<HugeiconsIcon icon={ArrowDown} {...withDefaultIconSize(props)} />
);
export const FolderOpen = (props: IconProps) => (
	<HugeiconsIcon icon={Archive04Icon} {...withDefaultIconSize(props)} />
);
export const LayoutAlignLeft = (props: IconProps) => (
	<HugeiconsIcon icon={LayoutAlignLeftIcon} {...withDefaultIconSize(props)} />
);
export const Settings = (props: IconProps) => (
	<HugeiconsIcon icon={Settings01Icon} {...withDefaultIconSize(props)} />
);
export const Calendar = (props: IconProps) => (
	<HugeiconsIcon icon={Calendar03Icon} {...withDefaultIconSize(props)} />
);

export function SidebarToggleIcon({
	size = 16,
	className,
	...props
}: {
	size?: number | string;
	className?: string;
} & React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.25"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
			{...props}
		>
			<rect x="1.75" y="2.25" width="12.5" height="11.5" rx="2" />
			<line x1="5.75" y1="2.25" x2="5.75" y2="13.75" />
		</svg>
	);
}

export function NavArrowLeftIcon({
	size = 16,
	className,
	...props
}: {
	size?: number | string;
	className?: string;
} & React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.3"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
			{...props}
		>
			<path d="M12.5 8H3.5" />
			<path d="M7 4.5L3.5 8L7 11.5" />
		</svg>
	);
}

export function NavArrowRightIcon({
	size = 16,
	className,
	...props
}: {
	size?: number | string;
	className?: string;
} & React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.3"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
			{...props}
		>
			<path d="M3.5 8H12.5" />
			<path d="M9 4.5L12.5 8L9 11.5" />
		</svg>
	);
}
