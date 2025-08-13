import React from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

export default function License(): JSX.Element {
  return (
    <Layout
      title="License - Fingerprint OSS"
      description="LGPL-3.0 License for Fingerprint OSS - Free & Open Source Browser Fingerprinting"
    >
      <main className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset--2">
            <Heading as="h1">License</Heading>
            
            <div className="margin-vert--lg">
              <p>
                Fingerprint OSS is released under the <strong>GNU Lesser General Public License v3.0</strong> (LGPL-3.0).
                This license ensures that the library remains free and open source while providing flexibility for commercial use.
              </p>
              
              <div className="alert alert--info margin-vert--md">
                <strong>What this means:</strong> You can use Fingerprint OSS in both open source and commercial projects, 
                but if you modify the library itself, you must release those modifications under the same license.
              </div>
            </div>

            <div className="margin-vert--lg">
              <Heading as="h2">LGPL-3.0 License Text</Heading>
              
              <div className="margin-vert--md">
                <pre style={{ 
                  backgroundColor: 'var(--ifm-card-background-color)', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  overflow: 'auto',
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                }}>
{`                    GNU LESSER GENERAL PUBLIC LICENSE
                       Version 3, 29 June 2007

 Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.


  This version of the GNU Lesser General Public License incorporates
the terms and conditions of version 3 of the GNU General Public License,
supplemented by the additional permissions listed below.

  0. Additional Definitions.

  As used herein, "this License" refers to version 3 of the GNU Lesser
General Public License, and the "GNU GPL" refers to version 3 of the GNU
General Public License.

  "The Library" refers to a covered work governed by this License,
other than an Application or a Combined Work as defined below.

  An "Application" is any work that makes use of an interface provided
by the Library, but which is not otherwise based on the Library.
Defining a subclass of a class defined by the Library is deemed a mode
of using an interface provided by the Library.

  A "Combined Work" is a work produced by combining or linking an
Application with the Library.  The particular version of the Library
with which the Combined Work was made is also called the "Linked
Version".

  The "Minimal Corresponding Source" for a Combined Work means the
Corresponding Source for the Combined Work, excluding any source code
for portions of the Combined Work that, considered in isolation, are
based on the Application, and not on the Linked Version.

  The "Corresponding Application Code" for a Combined Work means the
object code and/or source code for the Application, including any data
and utility programs needed for reproducing the Combined Work from the
Application, but excluding the System Libraries of the Combined Work.

  1. Exception to Section 3 of the GNU GPL.

  You may convey a covered work under sections 3 and 4 of this License
without being bound by section 3 of the GNU GPL.

  2. Conveying Modified Versions.

  If you modify a copy of the Library, and, in your modification, a
facility refers to a function or a table of data to be supplied by an
Application that uses the facility (other than as an argument passed
when the facility is invoked), then you may convey a copy of the
modified version:

   a) under this License, provided that you make a good faith effort to
   ensure that, in the event an Application does not supply the
   function or table, the facility still operates, and performs
   whatever part of its purpose remains meaningful, or

   b) under the GNU GPL, with none of the additional permissions of
   this License applicable to that copy.

  3. Object Code Incorporating Material from Library Header Files.

  The object code form of an Application may incorporate material from
a header file that is part of the Library.  You may convey such object
code under terms of your choice, provided that, if the incorporated
material is not limited to numerical parameters, data structure
layouts and accessors, or small macros, inline functions and templates
(ten or fewer lines in length), you do both of the following:

   a) Give prominent notice that each copy of the object code is
   (or will be) licensed under the GNU GPL and this License, and

   b) Accompany each copy of the object code with a copy of the GNU GPL
   and this License document.

  4. Combined Works.

  You may convey a Combined Work under terms of your choice that,
taken together, effectively do not restrict modification of the
portions of the Library contained in the Combined Work and reverse
engineering for debugging such modifications, if you also do each of
the following:

   a) Give prominent notice that the Library is used in the Combined
   Work and that the Library and its use are covered by this License.

   b) Accompany the Combined Work with a copy of the GNU GPL and this
   License document.

   c) For a Combined Work that displays copyright notices during
   execution, include the copyright notice for the Library among
   these notices, as well as a reference directing the user to the
   copies of the GNU GPL and this License document.

   d) Do one of the following:

       0) Convey the Minimal Corresponding Source under the terms of this
       License, and the Corresponding Application Code in a form suitable
       for, and under terms that permit, the user to recombine or
       relink the Application with a modified version of the Linked
       Version to produce a modified Combined Work, in the manner
       specified by section 6 of the GNU GPL for conveying
       Corresponding Source.

       1) Use a suitable shared library mechanism for linking with the
       Library.  A suitable mechanism is one that (a) uses at run time
       a copy of the Library already present on the user's computer
       system, and (b) will operate properly with a modified version
       of the Library that is interface-compatible with the Linked
       Version.

   e) Provide Installation Information, but only if you would otherwise
   be required to provide such information under section 6 of the
   GNU GPL, and only to the extent that such information is
   necessary to install and execute a modified version of the
   Combined Work produced by recombining or relinking the
   Application with a modified version of the Linked Version.  (If
   you use option 4d0, the Installation Information must accompany
   the Minimal Corresponding Source and Corresponding Application
   Code. If you use option 4d1, you must provide the Installation
   Information in the manner specified by section 6 of the GNU GPL
   for conveying Corresponding Source.)

  5. Combined Libraries.

  You may place library facilities that are a work based on the
Library side by side in a single library together with other library
facilities that are not Applications and are not covered by this
License, and convey such a combined library under terms of your
choice, if you do both of the following:

   a) Accompany the combined library with a copy of the same work
   based on the Library, uncombined with any other library
   facilities, conveyed under the terms of this License.

   b) Give prominent notice with the combined library that part of it
   is a work based on the Library, and explaining where to find the
   accompanying uncombined form of the same work.

  6. Revised Versions of the GNU Lesser General Public License.

  The Free Software Foundation may publish revised and/or new versions
of the GNU Lesser General Public License from time to time. Such new
versions will be similar in spirit to the present version, but may
differ in detail to address new problems or concerns.

  Each version is given a distinguishing version number. If the
Library as you received it specifies that a certain numbered version
of the GNU Lesser General Public License "or any later version"
applies to it, you have the option of following the terms and
conditions either of that published version or of any later version
published by the Free Software Foundation. If the Library as you
received it does not specify a version number of the GNU Lesser
General Public License, you may choose any version of the GNU Lesser
General Public License ever published by the Free Software Foundation.

  If the Library as you received it specifies that a proxy can decide
whether future versions of the GNU Lesser General Public License
shall apply, that proxy's public statement of acceptance of any
version is permanently authorized for you to choose that version
for the Library.`}
                </pre>
              </div>
            </div>

            <div className="margin-vert--lg">
              <Heading as="h2">Key Points</Heading>
              <ul>
                <li><strong>Free to Use:</strong> You can use Fingerprint OSS in any project, commercial or open source</li>
                <li><strong>Modification Requirements:</strong> If you modify the library, you must release modifications under LGPL-3.0</li>
                <li><strong>Linking:</strong> You can link to the library without being bound by the license terms</li>
                <li><strong>Attribution:</strong> You must acknowledge the use of Fingerprint OSS in your project</li>
              </ul>
            </div>

            <div className="margin-vert--lg">
              <Heading as="h2">Questions?</Heading>
              <p>
                If you have questions about how the LGPL-3.0 license applies to your use of Fingerprint OSS, 
                please consult with a legal professional or visit the{' '}
                <a href="https://www.gnu.org/licenses/lgpl-3.0.html" target="_blank" rel="noopener noreferrer">
                  GNU Lesser General Public License v3.0
                </a>{' '}
                page for detailed information.
              </p>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
