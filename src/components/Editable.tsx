import React from 'react';
import { useUIConfig } from '../contexts/UIConfigContext';
import { useLanguage } from '../contexts/LanguageContext';

interface EditableTextProps {
  configKey: string;
  defaultText: string;
  className?: string;
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'div';
}

export const EditableText: React.FC<EditableTextProps> = ({ 
  configKey, 
  defaultText, 
  className,
  as: Component = 'span' 
}) => {
  const { config } = useUIConfig();
  const { t } = useLanguage();
  const text = config[configKey] || defaultText;

  return (
    <Component className={className}>
      {t(text)}
    </Component>
  );
};

interface EditableImageProps {
  configKey: string;
  defaultSrc: string;
  alt?: string;
  className?: string;
}

export const EditableImage: React.FC<EditableImageProps> = ({ 
  configKey, 
  defaultSrc, 
  alt = '', 
  className 
}) => {
  const { config } = useUIConfig();
  const src = config[configKey] || defaultSrc;

  return (
    <img src={src} alt={alt} className={className} referrerPolicy="no-referrer" loading="lazy" decoding="async" />
  );
};
