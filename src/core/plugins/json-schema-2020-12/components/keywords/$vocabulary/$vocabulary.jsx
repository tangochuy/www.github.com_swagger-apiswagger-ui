/**
 * @prettier
 */
import React, { useCallback, useState } from "react"
import classNames from "classnames"

import { schema } from "../../../prop-types"
import { useComponent, useIsExpandedDeeply } from "../../../hooks"

const $vocabulary = ({ schema }) => {
  if (!schema?.$vocabulary) return null
  if (typeof schema.$vocabulary !== "object") return null

  const isExpandedDeeply = useIsExpandedDeeply()
  const [expanded, setExpanded] = useState(isExpandedDeeply)
  const Accordion = useComponent("Accordion")

  const handleExpansion = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  return (
    <div className="json-schema-2020-12-keyword json-schema-2020-12-keyword--$vocabulary">
      <Accordion expanded={expanded} onChange={handleExpansion}>
        <span className="json-schema-2020-12-keyword__name json-schema-2020-12-keyword__name--secondary">
          $vocabulary
        </span>
      </Accordion>
      <span className="json-schema-2020-12__type">object</span>
      <ul>
        {expanded &&
          Object.entries(schema.$vocabulary).map(([uri, enabled]) => (
            <li
              key={uri}
              className={classNames("json-schema-2020-12-$vocabulary-uri", {
                "json-schema-2020-12-$vocabulary-uri--disabled": !enabled,
              })}
            >
              <span className="json-schema-2020-12-keyword__value json-schema-2020-12-keyword__value--secondary">
                {uri}
              </span>
            </li>
          ))}
      </ul>
    </div>
  )
}

$vocabulary.propTypes = {
  schema: schema.isRequired,
}

export default $vocabulary
