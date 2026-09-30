import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, collection, addDoc, query, orderBy, limit, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logAudit } from '../lib/auth_security';

interface UIConfig {
  [key: string]: any;
}

interface UIConfigContextType {
  config: UIConfig;
  updateConfig: (path: string, value: any) => Promise<void>;
  rollback: (versionId: string) => Promise<void>;
  versions: any[];
}

const UIConfigContext = createContext<UIConfigContextType | undefined>(undefined);

export const UIConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<UIConfig>({});
  const [versions, setVersions] = useState<any[]>([]);

  useEffect(() => {
    // Listen to live config
    const unsub = onSnapshot(doc(db, 'settings', 'ui_config'), 
      (doc) => {
        if (doc.exists()) {
          setConfig(doc.data());
        }
      },
      (err) => console.warn("UI Config sync restricted:", err.message)
    );

    // Listen to versions for rollback - only if likely admin or to prevent crash
    const unsubVersions = onSnapshot(
      query(collection(db, 'ui_versions'), orderBy('timestamp', 'desc'), limit(20)),
      (snap) => {
        setVersions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        // Silently fail for normal users as they don't need this
        console.log("Versioning access restricted");
      }
    );

    return () => {
      unsub();
      unsubVersions();
    };
  }, []);

  const updateConfig = async (path: string, value: any) => {
    const newConfig = { ...config, [path]: value };
    
    // Save current as version before update
    await addDoc(collection(db, 'ui_versions'), {
      config: config,
      timestamp: new Date(),
      change: `Updated ${path}`
    });

    await setDoc(doc(db, 'settings', 'ui_config'), newConfig);
  };

  const rollback = async (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (!version) return;

    await addDoc(collection(db, 'ui_versions'), {
      config: config,
      timestamp: new Date(),
      change: `Rollback to ${versionId}`
    });

    // implementation will be in CipherAdmin actually for better control
  };

  return (
    <UIConfigContext.Provider value={{ config, updateConfig, rollback, versions }}>
      {children}
    </UIConfigContext.Provider>
  );
};

export const useUIConfig = () => {
  const context = useContext(UIConfigContext);
  if (!context) throw new Error('useUIConfig must be used within UIConfigProvider');
  return context;
};
