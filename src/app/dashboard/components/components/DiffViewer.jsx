import React from 'react';

const isObject = (obj) => obj && typeof obj === 'object' && !Array.isArray(obj);

const excludedKeys = ['_id', '__v', 'originalSite', 'researchExpertId', 'status', 'action', 'type', 'adminFeedback', 'expiresAt', 'createdAt', 'updatedAt'];

const JsonNode = ({ data, path, getHighlight }) => {
    const isHighlighted = getHighlight(path, data);

    if (!isObject(data) && !Array.isArray(data)) {
        return <span className={isHighlighted ? "bg-green-100" : ""}>{JSON.stringify(data)}</span>;
    }

    return (
        <span className={isHighlighted && !Array.isArray(data) ? "bg-green-100" : ""}>
            {Array.isArray(data) ? '[' : '{'}
            <div className="pl-4">
                {Object.keys(data).map((key, index) => {
                    if (excludedKeys.includes(key)) {
                        return null;
                    }
                    const newPath = [...path, key];
                    return (
                        <div key={key}>
                            <span className="text-gray-500">"{key}": </span>
                            <JsonNode data={data[key]} path={newPath} getHighlight={getHighlight} />
                            {index < Object.keys(data).length - 1 ? ',' : ''}
                        </div>
                    );
                })}
            </div>
            {Array.isArray(data) ? ']' : '}'}
        </span>
    );
};

const DiffViewer = ({ original, modified, action, type }) => {
    if (action === 'add' && type === 'site') {
        const cleanedModified = { ...modified };
        for (const key of excludedKeys) {
            delete cleanedModified[key];
        }
        return (
            <div className="bg-green-100 p-4 rounded-lg">
                <pre className="text-sm">{JSON.stringify(cleanedModified, null, 2)}</pre>
            </div>
        );
    }

    const getHighlight = (path, data) => {
        if (action === 'add' && type === 'inscription') {
            const newInscriptionId = modified.Inscriptions[modified.Inscriptions.length - 1].Inscription_id;
            if (path[0] === 'Inscriptions') {
                const inscription = modified.Inscriptions[path[1]];
                return inscription?.Inscription_id === newInscriptionId;
            }
            return false;
        }

        if (action === 'modify') {
            let originalValue = original;
            try {
                for (const key of path) {
                    originalValue = originalValue[key];
                }
            } catch (e) {
                return true; // It's a new field
            }
            
            if (typeof originalValue === 'undefined' && typeof data !== 'undefined') {
                return true; // New field
            }

            return JSON.stringify(originalValue) !== JSON.stringify(data);
        }

        return false;
    };

    const cleanedModified = { ...modified };
    delete cleanedModified.originalSite;

    return <JsonNode data={cleanedModified} path={[]} getHighlight={getHighlight} />;
};

export default DiffViewer;
